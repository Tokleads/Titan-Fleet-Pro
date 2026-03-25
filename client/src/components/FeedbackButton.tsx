import { useState } from "react";
import { MessageSquarePlus, X, Bug, Lightbulb, ThumbsUp, Star, Send, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { session } from "@/lib/session";

type FeedbackType = "bug" | "feature" | "general";

const MAX_CHARS = 500;

const TYPE_CONFIG: Record<FeedbackType, { label: string; shortLabel: string; icon: React.ElementType; placeholder: string; activeClass: string }> = {
  bug: {
    label: "Bug Report",
    shortLabel: "Bug",
    icon: Bug,
    placeholder: "What went wrong? What did you expect to happen?",
    activeClass: "bg-red-100 text-red-700 border-red-200",
  },
  feature: {
    label: "Feature Request",
    shortLabel: "Idea",
    icon: Lightbulb,
    placeholder: "What would you like to see? How would it help you?",
    activeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  general: {
    label: "General Feedback",
    shortLabel: "General",
    icon: ThumbsUp,
    placeholder: "Share any thoughts, suggestions, or comments.",
    activeClass: "bg-green-100 text-green-700 border-green-200",
  },
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" aria-label="Rate your experience">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          data-testid={`star-rating-${star}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface FeedbackButtonProps {
  variant?: "floating" | "driver";
}

function FeedbackPanel({ onClose, token }: { onClose: () => void; token: string | null }) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const { toast } = useToast();

  const user = session.getUser();
  const currentPage = window.location.pathname;
  const charsLeft = MAX_CHARS - message.length;
  const config = TYPE_CONFIG[type];

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/beta-feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type,
          message: message.trim(),
          rating: rating > 0 ? rating : undefined,
          page: currentPage,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const titles: Record<FeedbackType, string> = {
        bug: "Bug reported!",
        feature: "Feature request sent!",
        general: "Thanks for the feedback!",
      };
      toast({
        title: titles[type],
        description: "We review every submission — thank you.",
      });
      setMessage("");
      setRating(0);
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Failed to send", description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Beta Feedback</h3>
          <p className="text-xs text-slate-500 mt-0.5">Help us build a better platform</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          aria-label="Close feedback panel"
          data-testid="button-close-feedback"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {user && (
          <div className="bg-slate-50 rounded-lg px-3 py-2 space-y-1 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">From</span>
              <span className="text-xs font-medium text-slate-700" data-testid="feedback-user-name">{user.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Page</span>
              <span className="text-xs font-mono text-slate-600 truncate max-w-[160px]" data-testid="feedback-page-url">{currentPage}</span>
            </div>
          </div>
        )}

        <div className="flex gap-1.5">
          {(Object.keys(TYPE_CONFIG) as FeedbackType[]).map((t) => {
            const Icon = TYPE_CONFIG[t].icon;
            const isActive = type === t;
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium transition-colors border ${
                  isActive
                    ? TYPE_CONFIG[t].activeClass
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
                data-testid={`button-feedback-${t}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{TYPE_CONFIG[t].shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            placeholder={config.placeholder}
            className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            data-testid="input-feedback-message"
          />
          <span
            className={`absolute bottom-2 right-3 text-[10px] tabular-nums ${
              charsLeft < 50 ? "text-red-400" : "text-slate-400"
            }`}
          >
            {charsLeft}
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowRating(!showRating)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            data-testid="button-toggle-rating"
          >
            {showRating ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Rate your experience (optional)
          </button>
          <AnimatePresence>
            {showRating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 flex items-center gap-3">
                  <StarRating value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <span className="text-xs text-slate-500">
                      {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isSubmitting}
          className="w-full h-10 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          data-testid="button-submit-feedback"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Sending..." : "Send Feedback"}
        </button>
      </div>
    </motion.div>
  );
}

export function FeedbackButton({ variant = "floating" }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const token = session.getToken();

  if (variant === "driver") {
    return (
      <>
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          data-testid="button-feedback-driver"
          aria-label="Send feedback"
          title="Send feedback"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => setIsOpen(false)}
              />
              <FeedbackPanel onClose={() => setIsOpen(false)} token={token} />
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-4 z-40 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center hover:scale-105"
        data-testid="button-feedback"
        aria-label="Send feedback"
        title="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsOpen(false)}
            />
            <FeedbackPanel onClose={() => setIsOpen(false)} token={token} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
