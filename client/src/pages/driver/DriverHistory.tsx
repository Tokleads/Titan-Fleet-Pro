import { useState, useEffect, useMemo, useCallback } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Inspection, FuelEntry } from "@shared/schema";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { Check, AlertTriangle, Fuel, Clock, FileText, ChevronRight, ChevronDown, MapPin, LogIn, LogOut, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function DriverHistory() {
  const [, setLocation] = useLocation();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [timesheetEntries, setTimesheetEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "inspections" | "fuel" | "shifts">("all");
  const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);

  const today = new Date();
  const mondayThisWeek = getMonday(today);
  const [shiftDateRange, setShiftDateRange] = useState({
    start: toDateStr(mondayThisWeek),
    end: toDateStr(today),
  });
  const [shiftPreset, setShiftPreset] = useState<string>("thisWeek");

  const handleShiftPreset = useCallback((preset: string) => {
    setShiftPreset(preset);
    const now = new Date();
    switch (preset) {
      case "thisWeek": {
        setShiftDateRange({ start: toDateStr(getMonday(now)), end: toDateStr(now) });
        break;
      }
      case "lastWeek": {
        const mon = getMonday(now);
        const lastMon = new Date(mon);
        lastMon.setDate(mon.getDate() - 7);
        const lastSun = new Date(mon);
        lastSun.setDate(mon.getDate() - 1);
        setShiftDateRange({ start: toDateStr(lastMon), end: toDateStr(lastSun) });
        break;
      }
      case "thisMonth": {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        setShiftDateRange({ start: toDateStr(first), end: toDateStr(now) });
        break;
      }
      case "lastMonth": {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0);
        setShiftDateRange({ start: toDateStr(first), end: toDateStr(last) });
        break;
      }
      case "last30": {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        setShiftDateRange({ start: toDateStr(d), end: toDateStr(now) });
        break;
      }
    }
  }, []);

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

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user || !company) return;
    let mounted = true;
    const params = new URLSearchParams({
      startDate: shiftDateRange.start,
      endDate: shiftDateRange.end,
    });
    fetch(`/api/driver/timesheets/${company.id}/${user.id}?${params}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => { if (mounted) setTimesheetEntries(Array.isArray(data) ? data : []); })
      .catch(err => console.error("Failed to load timesheets:", err));

    return () => { mounted = false; };
  }, [shiftDateRange]);

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
            {activeTab === "shifts" && (
              <div className="space-y-3 mb-4">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { key: "thisWeek", label: "This Week" },
                    { key: "lastWeek", label: "Last Week" },
                    { key: "thisMonth", label: "This Month" },
                    { key: "lastMonth", label: "Last Month" },
                    { key: "last30", label: "Last 30 Days" },
                    { key: "custom", label: "Custom" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleShiftPreset(p.key)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
                        shiftPreset === p.key
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      data-testid={`button-shift-preset-${p.key}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {shiftPreset === "custom" && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="date"
                      value={shiftDateRange.start}
                      onChange={(e) => setShiftDateRange({ ...shiftDateRange, start: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      data-testid="input-shift-start-date"
                    />
                    <span className="text-slate-400 text-xs">to</span>
                    <input
                      type="date"
                      value={shiftDateRange.end}
                      onChange={(e) => setShiftDateRange({ ...shiftDateRange, end: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      data-testid="input-shift-end-date"
                    />
                  </div>
                )}

                <div className="titan-card p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">
                        Total Hours
                      </p>
                      <p className="text-2xl font-bold text-purple-900 mt-1" data-testid="text-total-hours">
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
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(shiftDateRange.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {new Date(shiftDateRange.end).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </div>
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
                    <div>
                      <button
                        onClick={() => setExpandedShiftId(expandedShiftId === item.data.id ? null : item.data.id)}
                        className="w-full flex items-center gap-3 text-left"
                      >
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
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
                        <div className="flex items-center gap-2">
                          {item.data.totalMinutes ? (
                            <span className="text-sm font-bold text-purple-700">
                              {Math.floor(item.data.totalMinutes / 60)}h {item.data.totalMinutes % 60}m
                            </span>
                          ) : item.data.status === "ACTIVE" ? (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                          {expandedShiftId === item.data.id ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </button>
                      {expandedShiftId === item.data.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 pt-3 border-t border-slate-100 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-purple-50 rounded-xl p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <LogIn className="h-3.5 w-3.5 text-purple-500" />
                                <span className="text-[10px] uppercase tracking-wider text-purple-600 font-medium">Clocked In</span>
                              </div>
                              <p className="text-sm font-bold text-slate-900">
                                {new Date(item.data.arrivalTime).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <LogOut className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">Clocked Out</span>
                              </div>
                              <p className="text-sm font-bold text-slate-900">
                                {item.data.departureTime
                                  ? new Date(item.data.departureTime).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                                  : "Still active"}
                              </p>
                            </div>
                          </div>
                          <div className="bg-purple-50/50 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-purple-500" />
                                <span className="text-[10px] uppercase tracking-wider text-purple-600 font-medium">Total Hours</span>
                              </div>
                              <p className="text-lg font-bold text-purple-700">
                                {item.data.totalMinutes
                                  ? `${Math.floor(item.data.totalMinutes / 60)}h ${item.data.totalMinutes % 60}m`
                                  : "In progress"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{item.data.depotName || "Unknown depot"}</span>
                            <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.data.status === "COMPLETED" ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {item.data.status}
                            </span>
                          </div>
                        </motion.div>
                      )}
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