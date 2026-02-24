import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { session } from "@/lib/session";
import { FileText, CheckCircle2, X, ChevronRight } from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const categoryLabels: Record<string, string> = {
  TOOLBOX_TALK: "Toolbox Talk",
  HANDBOOK: "Handbook",
  POLICY: "Policy",
  NOTICE: "Notice",
};

interface DocumentsPopupProps {
  onClose: () => void;
}

export function DocumentsPopup({ onClose }: DocumentsPopupProps) {
  const company = session.getCompany();
  const driver = session.getUser();
  const companyId = company?.id;
  const userId = driver?.id;
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<number>>(new Set());

  const { data: unreadDocs, isLoading } = useQuery({
    queryKey: ["unread-documents", companyId, userId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/unread?companyId=${companyId}&userId=${userId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!companyId && !!userId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const res = await fetch(`/api/documents/${documentId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to acknowledge document");
      return res.json();
    },
    onSuccess: (_, documentId) => {
      setAcknowledgedIds(prev => new Set(Array.from(prev).concat(documentId)));
      queryClient.invalidateQueries({ queryKey: ["unread-documents"] });
      setSelectedDoc(null);
    },
  });

  const remainingDocs = unreadDocs?.filter((d: any) => !acknowledgedIds.has(d.id)) || [];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-500 mt-4 text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (remainingDocs.length === 0) {
    return null;
  }

  if (selectedDoc) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-sm text-slate-600 font-medium">{categoryLabels[selectedDoc.category] || selectedDoc.category}</span>
            </div>
            <button 
              onClick={() => setSelectedDoc(null)} 
              className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">{selectedDoc.title}</h2>
            {selectedDoc.description && (
              <p className="text-sm text-slate-600 mb-4">{selectedDoc.description}</p>
            )}
            {selectedDoc.content && (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedDoc.content}
              </div>
            )}
            {selectedDoc.fileUrl && (
              <a 
                href={selectedDoc.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:underline text-sm font-medium"
              >
                <FileText className="h-4 w-4" />
                View attached file
              </a>
            )}
          </div>

          <div className="p-4 border-t border-slate-100">
            <button 
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50"
              onClick={() => acknowledgeMutation.mutate(selectedDoc.id)}
              disabled={acknowledgeMutation.isPending}
              data-testid="button-acknowledge"
            >
              {acknowledgeMutation.isPending ? (
                "Confirming..."
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  I have read and understood
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto w-full">
        <div className="space-y-3 text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Driver documents
          </h2>
          <p className="text-sm text-slate-600">
            You have {remainingDocs.length} new document{remainingDocs.length !== 1 ? 's' : ''} to review.
          </p>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
          {remainingDocs.map((doc: any) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 active:scale-[0.98] transition text-left"
              data-testid={`button-doc-${doc.id}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{doc.title}</p>
                <p className="text-xs text-slate-500">{categoryLabels[doc.category] || doc.category}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button 
            className="flex-1 rounded-xl border border-slate-300 py-3 text-slate-700 font-medium hover:bg-slate-50 active:scale-[0.98] transition"
            onClick={onClose}
            data-testid="button-later"
          >
            Later
          </button>
          <button 
            className="flex-1 rounded-xl bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition"
            onClick={() => setSelectedDoc(remainingDocs[0])}
            data-testid="button-read-document"
          >
            Read document
          </button>
        </div>
      </div>
    </div>
  );
}
