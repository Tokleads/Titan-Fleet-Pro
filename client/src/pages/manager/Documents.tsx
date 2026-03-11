import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanButton } from "@/components/titan-ui/Button";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import { 
  FileText,
  Plus,
  Clock,
  Users,
  Eye,
  EyeOff,
  Trash2,
  X,
  Upload,
  Loader2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Send,
  FileIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryLabels: Record<string, string> = {
  TOOLBOX_TALK: "Toolbox Talk",
  HANDBOOK: "Handbook",
  POLICY: "Policy",
  NOTICE: "Notice",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  NORMAL: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function ManagerDocuments() {
  const company = session.getCompany();
  const manager = session.getUser();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [newDoc, setNewDoc] = useState({
    title: "",
    description: "",
    category: "TOOLBOX_TALK",
    priority: "NORMAL",
    content: "",
    fileUrl: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newDoc.title) {
        setNewDoc(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !companyId) return null;
    
    try {
      setIsUploading(true);
      const res = await fetch("/api/manager/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ companyId, filename: selectedFile.name }),
      });
      
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, storagePath } = await res.json();
      
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type || "application/octet-stream" },
      });
      
      if (!uploadRes.ok) throw new Error("Failed to upload file");
      return storagePath;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const { data: documents, isLoading } = useQuery({
    queryKey: ["manager-documents", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/documents/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: users } = useQuery({
    queryKey: ["users", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (doc: any) => {
      let fileUrl = doc.fileUrl;
      if (selectedFile) {
        const uploadedPath = await uploadFile();
        if (uploadedPath) {
          fileUrl = uploadedPath;
        }
      }
      
      const res = await fetch("/api/manager/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          ...doc,
          fileUrl,
          companyId,
          createdBy: manager?.id,
          requiresAcknowledgment: true,
          publishedToDrivers: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to create document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-documents"] });
      setShowCreateModal(false);
      setSelectedFile(null);
      setNewDoc({ title: "", description: "", category: "TOOLBOX_TALK", priority: "NORMAL", content: "", fileUrl: "" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const res = await fetch(`/api/manager/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ publishedToDrivers: published }),
      });
      if (!res.ok) throw new Error("Failed to update document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-documents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/manager/documents/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to delete document");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-documents"] });
    },
  });

  const handleViewDocument = async (docId: number) => {
    try {
      setViewingDocId(docId);
      const res = await fetch(`/api/manager/documents/${docId}/view-url`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to get view URL");
      const { viewUrl } = await res.json();
      window.open(viewUrl, '_blank');
    } catch (error) {
      console.error("Error viewing document:", error);
    } finally {
      setViewingDocId(null);
    }
  };

  const driverCount = users?.filter((u: any) => u.role === "DRIVER" && u.active).length || 0;
  const activeDocuments = documents?.filter((d: any) => d.active) || [];
  const publishedCount = activeDocuments.filter((d: any) => d.publishedToDrivers).length;
  const draftCount = activeDocuments.filter((d: any) => !d.publishedToDrivers).length;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Driver Documents</h1>
            <p className="text-slate-500 mt-1">Manage documents that drivers must read and acknowledge</p>
          </div>
          <TitanButton size="sm" onClick={() => setShowCreateModal(true)} data-testid="button-new-document">
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </TitanButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TitanCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Documents</p>
                <p className="text-xl font-bold text-slate-900" data-testid="text-total-docs">{activeDocuments.length}</p>
              </div>
            </div>
          </TitanCard>
          <TitanCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Published to Drivers</p>
                <p className="text-xl font-bold text-green-600" data-testid="text-published-count">{publishedCount}</p>
              </div>
            </div>
          </TitanCard>
          <TitanCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <EyeOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Drafts (Not Visible)</p>
                <p className="text-xl font-bold text-amber-600" data-testid="text-draft-count">{draftCount}</p>
              </div>
            </div>
          </TitanCard>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : activeDocuments.length === 0 ? (
          <TitanCard className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No documents yet</h3>
            <p className="text-slate-500 mt-1">Create your first document for drivers to read</p>
            <TitanButton size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </TitanButton>
          </TitanCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDocuments.map((doc: any) => (
              <TitanCard key={doc.id} className="p-4 hover:shadow-md transition-shadow" data-testid={`card-document-${doc.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[doc.priority] || priorityColors.NORMAL}`}>
                        {doc.priority}
                      </span>
                      {doc.publishedToDrivers ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Live
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this document?')) {
                        deleteMutation.mutate(doc.id);
                      }
                    }}
                    className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                    data-testid={`button-delete-${doc.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <h3 className="font-semibold text-slate-900 mb-1" data-testid={`text-doc-title-${doc.id}`}>{doc.title}</h3>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{doc.description || doc.content?.substring(0, 100)}</p>
                
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">{categoryLabels[doc.category] || doc.category}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mb-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="h-3 w-3" />
                    0/{driverCount} read
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {doc.fileUrl && (
                    <button
                      onClick={() => handleViewDocument(doc.id)}
                      disabled={viewingDocId === doc.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      data-testid={`button-view-${doc.id}`}
                    >
                      {viewingDocId === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      View File
                    </button>
                  )}
                  
                  <button
                    onClick={() => togglePublishMutation.mutate({ id: doc.id, published: !doc.publishedToDrivers })}
                    disabled={togglePublishMutation.isPending}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      doc.publishedToDrivers 
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                    data-testid={`button-toggle-publish-${doc.id}`}
                  >
                    {doc.publishedToDrivers ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Publish
                      </>
                    )}
                  </button>
                </div>
              </TitanCard>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg p-6 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">New Document</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <EyeOff className="h-4 w-4 flex-shrink-0" />
                New documents are saved as drafts. You can publish them to drivers after reviewing.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g., Weekly Toolbox Talk - Winter Driving"
                  data-testid="input-doc-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newDoc.category}
                    onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="select-doc-category"
                  >
                    <option value="TOOLBOX_TALK">Toolbox Talk</option>
                    <option value="HANDBOOK">Handbook</option>
                    <option value="POLICY">Policy</option>
                    <option value="NOTICE">Notice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newDoc.priority}
                    onChange={(e) => setNewDoc({ ...newDoc, priority: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="select-doc-priority"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  className="w-full h-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Brief summary of the document..."
                  data-testid="input-doc-description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  className="w-full h-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Full document content..."
                  data-testid="input-doc-content"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload File</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                    data-testid="input-doc-file"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-medium text-slate-700">{selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedFile(null);
                          }}
                          className="ml-2 p-1 hover:bg-slate-200 rounded"
                        >
                          <X className="h-4 w-4 text-slate-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-sm text-slate-500">Click to upload file</span>
                        <p className="text-xs text-slate-400 mt-0.5">PDF, Word, Excel, Images</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-slate-400">or link to external file</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">External Link (optional)</label>
                <input
                  type="url"
                  value={newDoc.fileUrl}
                  onChange={(e) => setNewDoc({ ...newDoc, fileUrl: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://drive.google.com/..."
                  data-testid="input-doc-url"
                  disabled={!!selectedFile}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <TitanButton variant="outline" onClick={() => { setShowCreateModal(false); setSelectedFile(null); }}>
                Cancel
              </TitanButton>
              <TitanButton 
                onClick={() => createMutation.mutate(newDoc)}
                disabled={!newDoc.title || createMutation.isPending || isUploading}
                data-testid="button-create-document"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : createMutation.isPending ? "Creating..." : "Save as Draft"}
              </TitanButton>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
