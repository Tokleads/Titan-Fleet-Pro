/**
 * Fleet Documents Page
 * 
 * Manage vehicle and driver compliance documents (insurance, MOT, licenses, etc.)
 * Separate from the existing Documents page which handles driver training materials.
 */

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Pagination } from '@/components/Pagination';
import { ManagerLayout } from './ManagerLayout';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Search, Filter, Download, Trash2, AlertCircle, CheckCircle2, Calendar, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { session } from '@/lib/session';

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

const ALL_CATEGORIES = [...VEHICLE_CATEGORIES, ...DRIVER_CATEGORIES];

interface Document {
  id: number;
  category: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  entityType: 'VEHICLE' | 'DRIVER';
  entityId: number;
  entityName: string;
  expiryDate: string | null;
  description: string | null;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  uploadedAt: string;
  uploadedBy: string;
}

interface Stats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export default function FleetDocuments() {
  const { toast } = useToast();
  const companyId = session.getCompany()?.id || 1;
  
  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expiringSoon: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    category: '',
    entityType: 'VEHICLE' as 'VEHICLE' | 'DRIVER',
    entityId: '',
    expiryDate: '',
    description: '',
    file: null as File | null
  });

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId: companyId.toString(),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery })
      });
      
      const response = await fetch(`/api/fleet-documents?${params}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch documents');
      
      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/fleet-documents/stats?companyId=${companyId}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * itemsPerPage;
        const params = new URLSearchParams({
          companyId: companyId.toString(),
          limit: itemsPerPage.toString(),
          offset: offset.toString(),
          ...(categoryFilter !== 'all' && { category: categoryFilter }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(debouncedSearchQuery && { search: debouncedSearchQuery })
        });
        
        const [docsResponse, statsResponse] = await Promise.all([
          fetch(`/api/fleet-documents?${params}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/fleet-documents/stats?companyId=${companyId}`, { signal: controller.signal, headers: authHeaders() })
        ]);
        
        if (!docsResponse.ok || !statsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const [docsData, statsData] = await Promise.all([
          docsResponse.json(),
          statsResponse.json()
        ]);
        
        setDocuments(docsData.documents);
        setTotalItems(docsData.total || docsData.documents.length);
        setStats(statsData);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast({
            title: 'Error',
            description: 'Failed to load documents',
            variant: 'destructive'
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    return () => controller.abort();
  }, [categoryFilter, statusFilter, debouncedSearchQuery, currentPage, itemsPerPage]);

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.category || !uploadForm.entityId) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('category', uploadForm.category);
      formData.append('entityType', uploadForm.entityType);
      formData.append('entityId', uploadForm.entityId);
      formData.append('companyId', companyId.toString());
      if (uploadForm.expiryDate) formData.append('expiryDate', uploadForm.expiryDate);
      if (uploadForm.description) formData.append('description', uploadForm.description);
      
      const response = await fetch('/api/fleet-documents/upload', {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      toast({
        title: 'Success',
        description: 'Document uploaded successfully'
      });
      
      // Reset form and close dialog
      setUploadForm({
        category: '',
        entityType: 'VEHICLE',
        entityId: '',
        expiryDate: '',
        description: '',
        file: null
      });
      setUploadDialogOpen(false);
      
      // Refresh data
      fetchDocuments();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(`/api/fleet-documents/${id}?companyId=${companyId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      toast({
        title: 'Success',
        description: 'Document deleted successfully'
      });
      
      fetchDocuments();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive'
      });
    }
  };

  // Handle download
  const handleDownload = async (id: number, fileName: string) => {
    try {
      const response = await fetch(`/api/fleet-documents/${id}/download?companyId=${companyId}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Download failed');
      
      const data = await response.json();
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive'
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case 'EXPIRING_SOON':
        return <Badge className="bg-amber-500"><AlertCircle className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get category label
  const getCategoryLabel = (value: string) => {
    return ALL_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fleet Documents</h1>
            <p className="text-muted-foreground mt-1">
              Manage vehicle and driver compliance documents
            </p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a vehicle or driver compliance document
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Entity Type */}
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={uploadForm.entityType}
                    onValueChange={(value: 'VEHICLE' | 'DRIVER') => setUploadForm({ ...uploadForm, entityType: value, category: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VEHICLE">Vehicle Document</SelectItem>
                      <SelectItem value="DRIVER">Driver Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={uploadForm.category}
                    onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(uploadForm.entityType === 'VEHICLE' ? VEHICLE_CATEGORIES : DRIVER_CATEGORIES).map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Entity ID */}
                <div className="space-y-2">
                  <Label>{uploadForm.entityType === 'VEHICLE' ? 'Vehicle ID' : 'Driver ID'} *</Label>
                  <Input
                    type="number"
                    value={uploadForm.entityId}
                    onChange={(e) => setUploadForm({ ...uploadForm, entityId: e.target.value })}
                    placeholder={uploadForm.entityType === 'VEHICLE' ? 'Enter vehicle ID' : 'Enter driver ID'}
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Optional notes about this document"
                    rows={3}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>File * (PDF, JPG, PNG - Max 10MB)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  />
                  {uploadForm.file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Search and filter compliance documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by filename, entity name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ALL_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No documents found</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {getCategoryLabel(doc.category)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{doc.fileName}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatFileSize(doc.fileSize)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{doc.entityName}</div>
                            <div className="text-xs text-muted-foreground">{doc.entityType}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.expiryDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {formatDate(doc.expiryDate)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{formatDate(doc.uploadedAt)}</div>
                            <div className="text-xs text-muted-foreground">by {doc.uploadedBy}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.id, doc.fileName)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {!loading && documents.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage)}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1); // Reset to first page
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
  );
}
