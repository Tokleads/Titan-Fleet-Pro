/**
 * Fleet Documents API Routes
 * 
 * Handles vehicle and driver compliance documents (insurance, MOT, licenses, etc.)
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from './db.js';
import { fleetDocuments, vehicles, users } from '../shared/schema.js';
import { eq, and, sql, desc, or, like } from 'drizzle-orm';
import { storage } from './fleetDocumentStorage.js';
import { randomBytes } from 'crypto';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and WEBP are allowed.'));
    }
  }
});

// Helper function to calculate document status
function calculateDocumentStatus(expiryDate: Date | null): 'active' | 'expiring_soon' | 'expired' {
  if (!expiryDate) return 'active';
  
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'active';
}

// Helper function to get entity name
async function getEntityName(entityType: string, entityId: number): Promise<string> {
  if (entityType === 'vehicle') {
    const vehicle = await db.select({ vrm: vehicles.vrm })
      .from(vehicles)
      .where(eq(vehicles.id, entityId))
      .limit(1);
    return vehicle[0]?.vrm || 'Unknown Vehicle';
  } else {
    const user = await db.select({ name: users.name })
      .from(users)
      .where(eq(users.id, entityId))
      .limit(1);
    return user[0]?.name || 'Unknown Driver';
  }
}

/**
 * POST /api/fleet-documents/upload
 * Upload a new fleet document
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { category, entityType, entityId, description, expiryDate, companyId, uploadedBy } = req.body;
    
    // Validate required fields
    if (!companyId) {
      return res.status(400).json({ error: 'Missing required field: companyId' });
    }
    if (!category || !entityType || !entityId) {
      return res.status(400).json({ error: 'Missing required fields: category, entityType, entityId' });
    }
    
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const randomSuffix = randomBytes(8).toString('hex');
    const filename = `fleet-docs/${companyId}/${entityType}/${entityId}/${category}-${randomSuffix}.${fileExtension}`;
    
    // Upload to S3
    const uploadResult = await storage.put(filename, file.buffer, file.mimetype);
    
    // Calculate status
    const expiry = expiryDate ? new Date(expiryDate) : null;
    const status = calculateDocumentStatus(expiry);
    
    // Insert into database
    const [document] = await db.insert(fleetDocuments).values({
      companyId,
      filename,
      originalFilename: file.originalname,
      fileUrl: uploadResult.url,
      fileKey: uploadResult.key,
      mimeType: file.mimetype,
      fileSize: file.size,
      category,
      entityType,
      entityId: parseInt(entityId),
      description: description || null,
      expiryDate: expiry,
      status,
      uploadedBy
    }).returning();
    
    // Get entity name for response
    const entityName = await getEntityName(entityType, parseInt(entityId));
    
    res.json({
      success: true,
      document: {
        ...document,
        entityName
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

/**
 * GET /api/fleet-documents
 * Get all fleet documents with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyId, category, status, entityType, search, limit = '50', offset = '0' } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Missing required field: companyId' });
    }
    
    // Build where conditions
    const conditions = [eq(fleetDocuments.companyId, Number(companyId))];
    
    if (category && category !== 'all') {
      conditions.push(eq(fleetDocuments.category, category as string));
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(fleetDocuments.status, status as string));
    }
    
    if (entityType && entityType !== 'all') {
      conditions.push(eq(fleetDocuments.entityType, entityType as string));
    }
    
    if (search) {
      conditions.push(
        or(
          like(fleetDocuments.originalFilename, `%${search}%`),
          like(fleetDocuments.description, `%${search}%`)
        )!
      );
    }
    
    // Get documents
    const docs = await db.select()
      .from(fleetDocuments)
      .where(and(...conditions))
      .orderBy(desc(fleetDocuments.uploadedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    // Get entity names for all documents
    const documentsWithNames = await Promise.all(
      docs.map(async (doc: typeof docs[0]) => ({
        ...doc,
        entityName: await getEntityName(doc.entityType, doc.entityId)
      }))
    );
    
    // Get total count
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(fleetDocuments)
      .where(and(...conditions));
    
    res.json({
      documents: documentsWithNames,
      total: Number(count)
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * GET /api/fleet-documents/stats
 * Get document statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Missing required field: companyId' });
    }
    
    // Get counts by status
    const [activeCount] = await db.select({ count: sql<number>`count(*)` })
      .from(fleetDocuments)
      .where(and(
        eq(fleetDocuments.companyId, Number(companyId)),
        eq(fleetDocuments.status, 'active')
      ));
    
    const [expiringSoonCount] = await db.select({ count: sql<number>`count(*)` })
      .from(fleetDocuments)
      .where(and(
        eq(fleetDocuments.companyId, Number(companyId)),
        eq(fleetDocuments.status, 'expiring_soon')
      ));
    
    const [expiredCount] = await db.select({ count: sql<number>`count(*)` })
      .from(fleetDocuments)
      .where(and(
        eq(fleetDocuments.companyId, Number(companyId)),
        eq(fleetDocuments.status, 'expired')
      ));
    
    res.json({
      active: Number(activeCount.count),
      expiringSoon: Number(expiringSoonCount.count),
      expired: Number(expiredCount.count)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/fleet-documents/:id
 * Get a single document
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const documentId = parseInt(req.params.id);
    
    if (!companyId) {
      return res.status(400).json({ error: 'Missing required field: companyId' });
    }
    
    const [document] = await db.select()
      .from(fleetDocuments)
      .where(and(
        eq(fleetDocuments.id, documentId),
        eq(fleetDocuments.companyId, Number(companyId))
      ))
      .limit(1);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const entityName = await getEntityName(document.entityType, document.entityId);
    
    res.json({
      ...document,
      entityName
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

/**
 * PUT /api/fleet-documents/:id
 * Update document metadata
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const { description, expiryDate, category, companyId } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Missing required field: companyId' });
    }
    
    // Calculate new status if expiry date changed
    const expiry = expiryDate ? new Date(expiryDate) : null;
    const status = calculateDocumentStatus(expiry);
    
    const [updated] = await db.update(fleetDocuments)
      .set({
        description: description || null,
        expiryDate: expiry,
        status,
        category: category || undefined,
        updatedAt: new Date()
      })
      .where(and(
        eq(fleetDocuments.id, documentId),
        eq(fleetDocuments.companyId, Number(companyId))
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ success: true, document: updated });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

/**
 * DELETE /api/fleet-documents/:id
 * Delete a document
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const documentId = parseInt(req.params.id);
    
    if (!companyId) {
      return res.status(400).json({ error: 'Missing required field: companyId' });
    }
    
    // Get document to delete from S3
    const [document] = await db.select()
      .from(fleetDocuments)
      .where(and(
        eq(fleetDocuments.id, documentId),
        eq(fleetDocuments.companyId, Number(companyId))
      ))
      .limit(1);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete from S3
    try {
      await storage.delete(document.fileKey);
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // Continue with database deletion even if S3 fails
    }
    
    // Delete from database
    await db.delete(fleetDocuments)
      .where(eq(fleetDocuments.id, documentId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

/**
 * GET /api/fleet-documents/:id/download
 * Get download URL for a document
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const documentId = parseInt(req.params.id);
    
    if (!companyId) {
      return res.status(400).json({ error: 'Missing required field: companyId' });
    }
    
    const [document] = await db.select()
      .from(fleetDocuments)
      .where(and(
        eq(fleetDocuments.id, documentId),
        eq(fleetDocuments.companyId, Number(companyId))
      ))
      .limit(1);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Get signed URL from S3 (valid for 1 hour)
    const downloadUrl = await storage.getSignedUrl(document.fileKey, 3600);
    
    res.json({
      url: downloadUrl,
      filename: document.originalFilename
    });
  } catch (error) {
    console.error('Get download URL error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

export default router;
