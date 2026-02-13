import { useState, useEffect, useMemo } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Inspection, FuelEntry } from "@shared/schema";
import { Check, AlertTriangle, Fuel, Clock, FileText, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function DriverHistory() {
  const [, setLocation] = useLocation();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [timesheetEntries, setTimesheetEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "inspections" | "fuel" | "shifts">("all");

  const user = session.getUser();
  const company = session.getCompany();

  useEffect(() => {
    if (!user || !company) {
      setLocation('/app');
      return;
    }

    let mounted = true;
    const loadHistory = async () => {
      try {
        const [inspectionData, fuelData] = await Promise.all([
          api.getInspections(company.id, user.id, 30),
          api.getFuelEntries(company.id, user.id, 30)
        ]);
        if (mounted) {
          setInspections(inspectionData);
          setFuelEntries(fuelData);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadHistory();

    fetch(`/api/driver/timesheets/${company.id}/${user.id}`)
      .then(res => res.json())
      .then(data => { if (mounted) setTimesheetEntries(data); })
      .catch(err => console.error("Failed to load timesheets:", err));

    return () => { mounted = false; };
  }, []);

  const timeline = useMemo(() => {
    const items: Array<{ type: "inspection" | "fuel" | "shift"; date: Date; data: any }> = [];
    inspections.forEach(i => items.push({ type: "inspection", date: new Date(i.createdAt!), data: i }));
    fuelEntries.forEach(f => items.push({ type: "fuel", date: new Date(f.createdAt!), data: f }));
    timesheetEntries.forEach(t => items.push({ type: "shift", date: new Date(t.arrivalTime), data: t }));
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    if (activeTab === "inspections") return items.filter(i => i.type === "inspection");
    if (activeTab === "fuel") return items.filter(i => i.type === "fuel");
    if (activeTab === "shifts") return items.filter(i => i.type === "shift");
    return items;
  }, [inspections, fuelEntries, timesheetEntries, activeTab]);

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <DriverLayout>
      <div className="pb-4">
        <h1 className="text-xl font-bold text-slate-900 mb-4">History</h1>

        <div className="flex gap-2 mb-4">
          {(["all", "inspections", "fuel", "shifts"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab === "all" ? "All" : tab === "inspections" ? "Inspections" : tab === "fuel" ? "Fuel" : "Shifts"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="titan-card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <div className="titan-card p-8 text-center">
            <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-900">No history yet</p>
            <p className="text-sm text-slate-500 mt-1">Your inspections, fuel entries and shifts will appear here</p>
          </div>
        ) : (
          <>
            {activeTab === "shifts" && timesheetEntries.length > 0 && (
              <div className="titan-card p-4 mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Total Hours (Last 30 Days)</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {(() => {
                        const totalMins = timesheetEntries
                          .filter(t => t.status === "COMPLETED" && t.totalMinutes)
                          .reduce((sum, t) => sum + t.totalMinutes, 0);
                        const h = Math.floor(totalMins / 60);
                        const m = totalMins % 60;
                        return `${h}h ${m}m`;
                      })()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Completed Shifts</p>
                    <p className="text-lg font-bold text-slate-900">
                      {timesheetEntries.filter(t => t.status === "COMPLETED").length}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {timeline.map((item, idx) => (
                <motion.div
                  key={`${item.type}-${item.data.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="titan-card p-4"
                >
                  {item.type === "inspection" ? (
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        item.data.status === "PASS" ? "bg-emerald-100" : "bg-red-100"
                      }`}>
                        {item.data.status === "PASS" 
                          ? <Check className="h-5 w-5 text-emerald-600" />
                          : <AlertTriangle className="h-5 w-5 text-red-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">
                          {item.data.type === "END_OF_SHIFT" ? "End of Shift" : "Safety Check"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {formatDate(item.date)} · {item.data.odometer?.toLocaleString()} mi
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        item.data.status === "PASS" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-red-100 text-red-700"
                      }`} data-testid={`badge-status-${item.data.id}`}>
                        {item.data.status}
                      </span>
                    </div>
                  ) : item.type === "fuel" ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Fuel className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">
                          {item.data.fuelType === "ADBLUE" ? "AdBlue" : "Diesel"} · {item.data.litres}L
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(item.date)} · £{item.data.cost ? Number(item.data.cost).toFixed(2) : "—"}
                        </p>
                      </div>
                    </div>
                  ) : item.type === "shift" ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">
                          {item.data.depotName || "Shift"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(item.date)}
                          {item.data.departureTime && ` → ${new Date(item.data.departureTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
                        </p>
                      </div>
                      <div className="text-right">
                        {item.data.totalMinutes ? (
                          <span className="text-sm font-bold text-purple-700">
                            {Math.floor(item.data.totalMinutes / 60)}h {item.data.totalMinutes % 60}m
                          </span>
                        ) : item.data.status === "ACTIVE" ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </DriverLayout>
  );
}