/**
 * Fleet Documents Page
 * 
 * Manage vehicle and driver compliance documents (insurance, MOT, licenses, etc.)
 * Separate from the existing Documents page which handles driver training materials.
 */

import { useState } from 'react';
import { ManagerLayout } from './ManagerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Search, Filter, Download, Trash2, AlertCircle, CheckCircle2, Calendar, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Document categories
const VEHICLE_CATEGORIES = [
  { value: 'VEHICLE_INSURANCE', label: 'Insurance Certificate' },
  { value: 'VEHICLE_V5C', label: 'V5C Registration' },
  { value: 'VEHICLE_MOT_CERTIFICATE', label: 'MOT Certificate' },
  { value: 'VEHICLE_TAX_DISC', label: 'Tax Disc' },
  { value: 'VEHICLE_OPERATORS_LICENSE', label: 'Operators License' },
  { value: 'VEHICLE_TACHOGRAPH_CALIBRATION', label: 'Tachograph Calibration' },
  { value: 'VEHICLE_PLATING_CERTIFICATE', label: 'Plating Certificate' },
  { value: 'VEHICLE_OTHER', label: 'Other Vehicle Document' }
];

const DRIVER_CATEGORIES = [
  { value: 'DRIVER_LICENSE', label: 'Driving License' },
  { value: 'DRIVER_CPC', label: 'CPC Card' },
  { value: 'DRIVER_TACHO_CARD', label: 'Tachograph Card' },
  { value: 'DRIVER_MEDICAL', label: 'Medical Certificate' },
  { value: 'DRIVER_PASSPORT', label: 'Passport' },
  { value: 'DRIVER_PROOF_OF_ADDRESS', label: 'Proof of Address' },
  { value: 'DRIVER_RIGHT_TO_WORK', label: 'Right to Work' },
  { value: 'DRIVER_OTHER', label: 'Other Driver Document' }
];

// Mock data
const mockDocuments = [
  {
    id: 1,
    category: 'VEHICLE_INSURANCE',
    name: 'Fleet Insurance Certificate 2026',
    fileName: 'insurance-cert-2026.pdf',
    fileSize: 245000,
    vehicleVRM: 'AB12 CDE',
    expiryDate: '2026-12-31',
    status: 'ACTIVE',
    uploadedAt: '2026-01-15T10:00:00Z',
    uploadedBy: 'John Smith'
  },
  {
    id: 2,
    category: 'VEHICLE_MOT_CERTIFICATE',
    name: 'MOT Certificate - AB12 CDE',
    fileName: 'mot-ab12cde-2026.pdf',
    fileSize: 180000,
    vehicleVRM: 'AB12 CDE',
    expiryDate: '2026-02-15',
    status: 'EXPIRING_SOON',
    uploadedAt: '2025-02-15T14:30:00Z',
    uploadedBy: 'Sarah Johnson'
  },
  {
    id: 3,
    category: 'DRIVER_CPC',
    name: 'Driver CPC Card - Mike Wilson',
    fileName: 'cpc-mike-wilson.pdf',
    fileSize: 120000,
    driverName: 'Mike Wilson',
    expiryDate: '2028-06-30',
    status: 'ACTIVE',
    uploadedAt: '2026-01-10T09:00:00Z',
    uploadedBy: 'Admin'
  },
  {
    id: 4,
    category: 'VEHICLE_V5C',
    name: 'V5C Registration - XY34 FGH',
    fileName: 'v5c-xy34fgh.pdf',
    fileSize: 340000,
    vehicleVRM: 'XY34 FGH',
    expiryDate: null,
    status: 'ACTIVE',
    uploadedAt: '2025-11-20T11:15:00Z',
    uploadedBy: 'John Smith'
  },
  {
    id: 5,
    category: 'DRIVER_LICENSE',
    name: 'Driving License - Emma Davis',
    fileName: 'license-emma-davis.pdf',
    fileSize: 95000,
    driverName: 'Emma Davis',
    expiryDate: '2025-12-31',
    status: 'EXPIRED',
    uploadedAt: '2023-01-05T16:45:00Z',
    uploadedBy: 'Admin'
  }
];

export default function FleetDocuments() {
  return (
    <ManagerLayout>
      <FleetDocumentsContent />
    </ManagerLayout>
  );
}

function FleetDocumentsContent() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Upload form state
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const getStatusBadge = (status: string, expiryDate: string | null) => {
    if (!expiryDate) {
      return <Badge variant="outline">No Expiry</Badge>;
    }
    
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge variant="default" className="bg-orange-500">Expiring Soon</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
  };
  
  const getCategoryLabel = (category: string) => {
    const allCategories = [...VEHICLE_CATEGORIES, ...DRIVER_CATEGORIES];
    const found = allCategories.find(c => c.value === category);
    return found ? found.label : category;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };
  
  const handleUpload = async () => {
    if (!uploadFile || !uploadCategory || !uploadName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // TODO: Implement actual file upload to S3
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      
      toast({
        title: 'Document uploaded',
        description: `${uploadName} has been uploaded successfully.`,
        duration: 3000
      });
      
      // Reset form
      setUploadCategory('');
      setUploadName('');
      setUploadDescription('');
      setUploadExpiryDate('');
      setUploadFile(null);
      setUploadDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (documentId: number, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return;
    }
    
    try {
      // TODO: Implement actual delete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Document deleted',
        description: `${documentName} has been deleted.`,
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Filter documents
  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.vehicleVRM && doc.vehicleVRM.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.driverName && doc.driverName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Count documents by status
  const activeCount = mockDocuments.filter(d => d.status === 'ACTIVE').length;
  const expiringSoonCount = mockDocuments.filter(d => d.status === 'EXPIRING_SOON').length;
  const expiredCount = mockDocuments.filter(d => d.status === 'EXPIRED').length;
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fleet Documents</h1>
            <p className="text-muted-foreground">
              Manage vehicle and driver compliance documents
            </p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Compliance Document</DialogTitle>
                <DialogDescription>
                  Upload a vehicle or driver compliance document
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Document Category *</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-sm font-semibold">Vehicle Documents</div>
                      {VEHICLE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-sm font-semibold mt-2">Driver Documents</div>
                      {DRIVER_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Insurance Certificate 2026"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description or notes"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={uploadExpiryDate}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave blank if document doesn't expire
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">File *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Accepted formats: PDF, JPG, PNG (Max 10MB)
                  </p>
                  {uploadFile && (
                    <div className="text-sm text-green-600 flex items-center gap-2 mt-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {uploadFile.name} ({formatFileSize(uploadFile.size)})
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{activeCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{expiringSoonCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{expiredCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <div className="px-2 py-1.5 text-sm font-semibold">Vehicle Documents</div>
                {VEHICLE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
                <div className="px-2 py-1.5 text-sm font-semibold mt-2">Driver Documents</div>
                {DRIVER_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No documents found</p>
              <p className="text-muted-foreground mb-4">
                Upload your first compliance document to get started
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vehicle/Driver</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {doc.fileName} ({formatFileSize(doc.fileSize)})
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(doc.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        {doc.vehicleVRM && <Badge variant="secondary">{doc.vehicleVRM}</Badge>}
                        {doc.driverName && <span className="text-sm">{doc.driverName}</span>}
                      </TableCell>
                      <TableCell>
                        {doc.expiryDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(doc.expiryDate)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(doc.status, doc.expiryDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(doc.uploadedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(doc.id, doc.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
