import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { useLocation } from "wouter";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { 
  Send, 
  Radio,
  User,
  AlertCircle,
  CheckCircle2,
  Zap,
  Bell,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  MessageSquare
} from "lucide-react";
import { useState } from "react";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

interface SentNotification {
  id: number;
  companyId: number;
  senderId: number;
  recipientId: number | null;
  isBroadcast: boolean;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  recipientName: string | null;
}

export default function TitanCommand() {
  const company = session.getCompany();
  const manager = session.getUser();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [messageType, setMessageType] = useState<"broadcast" | "individual">("broadcast");
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");

  // Fetch all drivers
  const { data: drivers } = useQuery<UserInfo[]>({
    queryKey: ["users", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch users");
      const users = await res.json();
      return users.filter((u: UserInfo) => u.role === "DRIVER" && u.active);
    },
    enabled: !!companyId,
  });

  const { data: sentNotifications, isLoading: sentLoading } = useQuery<SentNotification[]>({
    queryKey: ["sent-notifications", companyId, manager?.id],
    queryFn: async () => {
      const res = await fetch(`/api/notifications/sent?companyId=${companyId}&senderId=${manager?.id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch sent notifications");
      return res.json();
    },
    enabled: !!companyId && !!manager?.id,
  });

  // Send broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; priority: string }) => {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          companyId,
          senderId: manager?.id,
          ...data
        })
      });
      if (!res.ok) throw new Error("Failed to send broadcast");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["sent-notifications"] });
      setTitle("");
      setMessage("");
      setPriority("NORMAL");
    }
  });

  // Send individual message mutation
  const individualMutation = useMutation({
    mutationFn: async (data: { recipientId: number; title: string; message: string; priority: string }) => {
      const res = await fetch('/api/notifications/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          companyId,
          senderId: manager?.id,
          ...data
        })
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["sent-notifications"] });
      setTitle("");
      setMessage("");
      setPriority("NORMAL");
      setSelectedDriver(null);
    }
  });

  const handleSend = () => {
    if (!title || !message) {
      alert("Please fill in all fields");
      return;
    }

    if (messageType === "broadcast") {
      broadcastMutation.mutate({ title, message, priority });
    } else {
      if (!selectedDriver) {
        alert("Please select a driver");
        return;
      }
      individualMutation.mutate({ recipientId: selectedDriver, title, message, priority });
    }
  };

  const priorityConfig = {
    LOW: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Bell },
    NORMAL: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Bell },
    HIGH: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
    URGENT: { color: "bg-red-100 text-red-700 border-red-200", icon: Zap }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-7 w-7 text-blue-600" />
              Titan Command
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Broadcast messages to drivers instantly
            </p>
          </div>
        </div>

        {/* Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Composer */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Compose Message</h2>
            
            {/* Message Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setMessageType("broadcast")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    messageType === "broadcast"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Radio className="h-5 w-5" />
                  <span className="font-medium">Broadcast to All</span>
                </button>
                <button
                  onClick={() => setMessageType("individual")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    messageType === "individual"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Individual Driver</span>
                </button>
              </div>
            </div>

            {/* Driver Selection (for individual messages) */}
            {messageType === "individual" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Driver
                </label>
                <select
                  value={selectedDriver || ""}
                  onChange={(e) => setSelectedDriver(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a driver...</option>
                  {drivers?.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map((p) => {
                  const config = priorityConfig[p];
                  const Icon = config.icon;
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                        priority === p
                          ? config.color
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Urgent: Route Change"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message Content
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={broadcastMutation.isPending || individualMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
              <span className="font-semibold">
                {broadcastMutation.isPending || individualMutation.isPending
                  ? "Sending..."
                  : messageType === "broadcast"
                  ? `Broadcast to ${drivers?.length || 0} Drivers`
                  : "Send Message"}
              </span>
            </button>

            {/* Success Message */}
            {(broadcastMutation.isSuccess || individualMutation.isSuccess) && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Message sent successfully!</span>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Active Drivers */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Active Drivers</h3>
              <div className="space-y-3">
                {drivers && drivers.length > 0 ? (
                  drivers.slice(0, 5).map((driver) => (
                    <button
                      key={driver.id}
                      onClick={() => navigate("/manager/drivers")}
                      className="flex items-center gap-3 w-full text-left rounded-xl p-2 -mx-2 hover:bg-blue-50/60 transition-colors group cursor-pointer"
                      data-testid={`link-driver-${driver.id}`}
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {driver.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                          {driver.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {driver.email}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No active drivers</p>
                )}
                {drivers && drivers.length > 5 && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    +{drivers.length - 5} more drivers
                  </p>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Use URGENT priority for critical safety alerts</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Broadcast reaches all active drivers instantly</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Drivers receive notifications on their mobile app</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* Message History */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Message History
          </h2>
          
          {sentLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : sentNotifications && sentNotifications.length > 0 ? (
            <div className="space-y-3">
              {sentNotifications.map((notif) => {
                const pConfig = priorityConfig[notif.priority as keyof typeof priorityConfig] || priorityConfig.NORMAL;
                const PIcon = pConfig.icon;
                const timeAgo = formatTimeAgo(notif.createdAt);
                return (
                  <div
                    key={notif.id}
                    className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors"
                    data-testid={`sent-notification-${notif.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{notif.title}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${pConfig.color}`}>
                            <PIcon className="h-3 w-3" />
                            {notif.priority}
                          </span>
                          {notif.isBroadcast ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                              <Radio className="h-3 w-3" />
                              All Drivers
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <User className="h-3 w-3" />
                              {notif.recipientName || "Unknown"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{notif.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </span>
                        {notif.isBroadcast ? (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            Broadcast
                          </span>
                        ) : notif.isRead ? (
                          <span className="text-xs text-emerald-500 flex items-center gap-1" data-testid={`status-read-${notif.id}`}>
                            <Eye className="h-3 w-3" />
                            Read
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500 flex items-center gap-1" data-testid={`status-unread-${notif.id}`}>
                            <EyeOff className="h-3 w-3" />
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No messages sent yet</p>
              <p className="text-xs text-slate-300 mt-1">Messages you send will appear here</p>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
