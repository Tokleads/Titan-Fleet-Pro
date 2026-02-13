import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanInput } from "@/components/titan-ui/Input";
import { Car, Clock, ArrowLeft, Square, Plus, History as HistoryIcon } from "lucide-react";
import { session } from "@/lib/session";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { CompanyCarRegister } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

export default function CarRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = session.getUser();
  const company = session.getCompany();

  const [numberPlate, setNumberPlate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user || !company) {
      setLocation("/app");
    }
  }, [user?.id, company?.id, setLocation]);

  const { data: entries = [], isLoading } = useQuery<CompanyCarRegister[]>({
    queryKey: ["car-register", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/car-register/driver/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch car register");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const activeEntry = entries.find((e) => !e.endTime);
  const pastEntries = entries.filter((e) => !!e.endTime);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/car-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: user?.id,
          companyId: company?.id,
          numberPlate: numberPlate.toUpperCase().replace(/\s+/g, ""),
          startTime: new Date().toISOString(),
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to register car");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Car Registered", description: `${numberPlate.toUpperCase()} registered to you.` });
      setNumberPlate("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["car-register", user?.id] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/car-register/${id}/end`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to return car");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Car Returned", description: "Car has been returned successfully." });
      queryClient.invalidateQueries({ queryKey: ["car-register", user?.id] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const handleRegister = () => {
    if (!numberPlate.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a number plate." });
      return;
    }
    registerMutation.mutate();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <DriverLayout>
      <div className="space-y-4 titan-page-enter">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/driver")}
            className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="titan-title" data-testid="text-page-title">Company Car Register</h1>
            <p className="titan-helper">Log which company car you're using</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeEntry ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="titan-card p-5 space-y-4 border-2 border-green-200 bg-green-50/50"
              data-testid="card-active-car"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Car className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Currently Using</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-wider" data-testid="text-active-plate">
                    {activeEntry.numberPlate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                <span data-testid="text-active-start">Since {formatDateTime(activeEntry.startTime as unknown as string)}</span>
              </div>
              {activeEntry.notes && (
                <p className="text-sm text-slate-500 bg-white/60 rounded-lg p-2" data-testid="text-active-notes">
                  {activeEntry.notes}
                </p>
              )}
              <TitanButton
                variant="destructive"
                className="w-full"
                onClick={() => returnMutation.mutate(activeEntry.id)}
                isLoading={returnMutation.isPending}
                data-testid="button-return-car"
              >
                <Square className="h-4 w-4 mr-2" />
                Return Car
              </TitanButton>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="titan-card p-5 space-y-4"
              data-testid="card-register-form"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Plus className="h-4 w-4 text-[#5B6CFF]" />
                <span>Register Car</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">
                    Number Plate
                  </label>
                  <input
                    placeholder="e.g. AB12 CDE"
                    className="w-full h-12 rounded-xl font-semibold tracking-wider border border-slate-300 px-4 uppercase focus:outline-none focus:ring-2 focus:ring-primary/25 titan-focus text-lg"
                    value={numberPlate}
                    onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                    maxLength={20}
                    data-testid="input-number-plate"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">
                    Notes (optional)
                  </label>
                  <Textarea
                    placeholder="e.g. Pool car for site visit"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl resize-none"
                    rows={2}
                    data-testid="input-notes"
                  />
                </div>
                <TitanButton
                  className="w-full"
                  onClick={handleRegister}
                  isLoading={registerMutation.isPending}
                  disabled={!numberPlate.trim()}
                  data-testid="button-register-car"
                >
                  <Car className="h-4 w-4 mr-2" />
                  Register Car
                </TitanButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {pastEntries.length > 0 && (
          <section className="space-y-3">
            <div className="titan-section-label flex items-center gap-2 ml-1">
              <HistoryIcon className="h-3 w-3" /> History
            </div>
            <div className="space-y-2">
              {pastEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="titan-card p-4"
                  data-testid={`card-history-${entry.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Car className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold tracking-wider text-slate-900" data-testid={`text-plate-${entry.id}`}>
                        {entry.numberPlate}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span data-testid={`text-dates-${entry.id}`}>
                          {formatDateTime(entry.startTime as unknown as string)} — {formatDateTime(entry.endTime as unknown as string)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {getDuration(entry.startTime as unknown as string, entry.endTime as unknown as string)}
                        </span>
                        {entry.notes && (
                          <span className="text-[10px] text-slate-400 truncate">{entry.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="titan-empty flex flex-col items-center gap-3 p-6" data-testid="empty-state">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 grid place-items-center">
              <Car className="h-7 w-7 text-slate-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-slate-900">No car register entries</p>
              <p className="titan-meta">Register a company car above to start logging</p>
            </div>
          </div>
        )}
      </div>
    </DriverLayout>
  );
}
