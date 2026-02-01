import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

interface Document {
  id: number;
  category: string;
  fileName: string;
  fileUrl: string;
  entityType: 'VEHICLE' | 'DRIVER';
  entityId: number;
  entityName?: string;
  expiryDate: string | null;
  status: 'active' | 'expiring_soon' | 'expired';
  uploadedBy: number;
  uploadedAt: string;
  description?: string;
}

interface DocumentsResponse {
  documents: Document[];
  total: number;
}

interface StatsResponse {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

interface FetchDocumentsParams {
  companyId: number;
  limit?: number;
  offset?: number;
  category?: string;
  status?: string;
  search?: string;
}

export function useFleetDocuments(params: FetchDocumentsParams) {
  return useQuery<DocumentsResponse>({
    queryKey: ['fleet-documents', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        companyId: params.companyId.toString(),
        ...(params.limit && { limit: params.limit.toString() }),
        ...(params.offset !== undefined && { offset: params.offset.toString() }),
        ...(params.category && params.category !== 'all' && { category: params.category }),
        ...(params.status && params.status !== 'all' && { status: params.status }),
        ...(params.search && { search: params.search }),
      });

      const response = await fetch(`/api/fleet-documents?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });
}

export function useFleetDocumentStats(companyId: number) {
  return useQuery<StatsResponse>({
    queryKey: ['fleet-documents-stats', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/fleet-documents/stats?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });
}

export function useUploadFleetDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/fleet-documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['fleet-documents'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-documents-stats'] });
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteFleetDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/fleet-documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-documents'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-documents-stats'] });
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete document',
        variant: 'destructive',
      });
    },
  });
}
