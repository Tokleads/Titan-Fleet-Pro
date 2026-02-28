import { useState, useRef, useEffect } from "react";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Send,
  FileText,
  Sparkles,
  Loader2,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ComplianceSource {
  sectionTitle: string;
  complianceReference: string | null;
  similarity: number;
  category: string | null;
}

interface ComplianceResponse {
  response: string;
  sources: ComplianceSource[];
  query: string;
  model: string;
  retrievedChunks: number;
}

interface ConversationEntry {
  query: string;
  result: ComplianceResponse;
  timestamp: Date;
}

const SUGGESTED_QUERIES = [
  "What are the operator's responsibilities for daily walkaround checks?",
  "When should a vehicle be placed on VOR status?",
  "What are the DVSA requirements for brake inspections?",
  "What constitutes a safety-critical defect?",
  "How often should maintenance inspections be performed?",
  "What records must operators keep for compliance?",
];

export default function ComplianceCopilot() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const queryMutation = useMutation({
    mutationFn: async (q: string): Promise<ComplianceResponse> => {
      const res = await fetch("/api/compliance/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to query compliance AI");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      setConversation((prev) => [
        ...prev,
        { query: variables, result: data, timestamp: new Date() },
      ]);
      setQuery("");
    },
    onError: (error: Error) => {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || queryMutation.isPending) return;
    queryMutation.mutate(trimmed);
  };

  const handleSuggestedQuery = (q: string) => {
    setQuery(q);
    queryMutation.mutate(q);
  };

  const toggleSources = (index: number) => {
    setExpandedSources((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatResponse = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-lg font-semibold text-slate-900 mt-4 mb-2 font-[Oswald]">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-xl font-bold text-slate-900 mt-5 mb-2 font-[Oswald]">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="font-semibold text-slate-800 mt-3 mb-1">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const content = line.replace(/^[-*] /, "");
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return (
          <li key={i} className="text-slate-700 ml-4 mb-1 list-disc">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j}>{part.replace(/\*\*/g, "")}</strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-slate-700 mb-1 leading-relaxed">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="text-slate-900">{part.replace(/\*\*/g, "")}</strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      );
    });
  };

  return (
    <ManagerLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4169b2] to-[#2d4a7a] flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 data-testid="text-page-title" className="text-2xl font-bold text-slate-900 font-[Oswald] tracking-tight">
                Compliance Copilot
              </h1>
              <p className="text-sm text-slate-500">
                AI-powered DVSA compliance guidance backed by official regulations
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">RAG Pipeline Active</span>
            </div>
          </div>

          {conversation.length === 0 && !queryMutation.isPending && (
            <div data-testid="section-welcome" className="mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#4169b2]" />
                  <h2 className="text-lg font-semibold text-slate-800">Suggested Questions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUGGESTED_QUERIES.map((q, i) => (
                    <button
                      key={i}
                      data-testid={`button-suggested-query-${i}`}
                      onClick={() => handleSuggestedQuery(q)}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-[#4169b2]/40 hover:bg-blue-50/50 transition-all text-sm text-slate-700 hover:text-slate-900 group"
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-[#4169b2] mt-0.5 flex-shrink-0" />
                        <span>{q}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 mb-6">
            {conversation.map((entry, index) => (
              <div key={index} className="space-y-4" data-testid={`conversation-entry-${index}`}>
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-[#4169b2] text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md">
                    <p className="text-sm">{entry.query}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {entry.result.sources.length > 0 && (
                    <div data-testid={`section-sources-${index}`} className="bg-amber-50/80 backdrop-blur-sm rounded-xl border border-amber-200/60 overflow-hidden">
                      <button
                        onClick={() => toggleSources(index)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 transition-colors"
                        data-testid={`button-toggle-sources-${index}`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-700" />
                          <span className="text-sm font-semibold text-amber-800">
                            Sources Retrieved ({entry.result.sources.length})
                          </span>
                        </div>
                        {expandedSources[index] ? (
                          <ChevronUp className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-amber-600" />
                        )}
                      </button>

                      {expandedSources[index] && (
                        <div className="px-4 pb-3 space-y-2 border-t border-amber-200/60">
                          {entry.result.sources.map((source, si) => (
                            <div
                              key={si}
                              data-testid={`source-item-${index}-${si}`}
                              className="flex items-start gap-3 py-2.5 border-b border-amber-100 last:border-0"
                            >
                              <FileText className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-amber-900 truncate">
                                  {source.complianceReference || source.sectionTitle}
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  {source.sectionTitle}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="h-1.5 w-16 rounded-full bg-amber-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-amber-500 transition-all"
                                    style={{ width: `${Math.min(source.similarity, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-amber-700">
                                  {source.similarity}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div data-testid={`section-analysis-${index}`} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <ShieldCheck className="w-4 h-4 text-[#4169b2]" />
                      <span className="text-sm font-semibold text-slate-700">AI Analysis</span>
                      <span className="ml-auto text-xs text-slate-400 font-mono">
                        {entry.result.model} · {entry.result.retrievedChunks} chunks
                      </span>
                    </div>
                    <div className="px-4 py-4">
                      <div className="prose prose-sm max-w-none">
                        {formatResponse(entry.result.response)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {queryMutation.isPending && (
              <div className="space-y-4" data-testid="loading-skeleton">
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-[#4169b2] text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md">
                    <p className="text-sm">{query || "..."}</p>
                  </div>
                </div>

                <div className="bg-amber-50/80 rounded-xl border border-amber-200/60 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span className="text-sm font-semibold text-amber-800">Searching DVSA database...</span>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-amber-200 animate-pulse" />
                        <div className="flex-1 h-4 rounded bg-amber-200/60 animate-pulse" />
                        <div className="w-12 h-4 rounded bg-amber-200 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/90 rounded-2xl border border-slate-200/60 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="w-4 h-4 text-[#4169b2] animate-spin" />
                    <span className="text-sm font-semibold text-slate-700">
                      Generating compliance analysis...
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
                    <div className="h-4 w-5/6 rounded bg-slate-100 animate-pulse" />
                    <div className="h-4 w-4/6 rounded bg-slate-100 animate-pulse" />
                    <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            <div ref={resultsEndRef} />
          </div>

          <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6 pb-4">
            <form onSubmit={handleSubmit} className="relative" data-testid="form-query">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg focus-within:border-[#4169b2]/40 focus-within:ring-2 focus-within:ring-[#4169b2]/10 transition-all">
                <textarea
                  ref={inputRef}
                  data-testid="input-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a compliance question... e.g. 'What are the DVSA rules for tyre tread depth on HGVs?'"
                  rows={2}
                  className="w-full px-4 pt-3 pb-2 bg-transparent border-0 resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  disabled={queryMutation.isPending}
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <p className="text-xs text-slate-400">
                    Powered by DVSA Guide to Roadworthiness · {conversation.length} queries this session
                  </p>
                  <button
                    type="submit"
                    data-testid="button-submit-query"
                    disabled={!query.trim() || queryMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4169b2] to-[#2d4a7a] text-white text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {queryMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{queryMutation.isPending ? "Analysing..." : "Ask Copilot"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
