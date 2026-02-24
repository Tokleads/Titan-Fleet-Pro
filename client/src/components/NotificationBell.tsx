import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, AlertCircle, AlertTriangle, Info, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { session } from "@/lib/session";
import type { Notification } from "@shared/schema";

const POLL_INTERVAL = 30000;

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const priorityConfig = {
  URGENT: { color: "bg-red-500", textColor: "text-red-600", icon: AlertCircle },
  HIGH: { color: "bg-orange-500", textColor: "text-orange-600", icon: AlertTriangle },
  NORMAL: { color: "bg-blue-500", textColor: "text-blue-600", icon: Info },
  LOW: { color: "bg-slate-400", textColor: "text-slate-500", icon: Clock }
};

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [, navigate] = useLocation();
  const user = session.getUser();
  const company = session.getCompany();
  
  const notificationsPath = user?.role === "driver" ? "/driver/notifications" : "/manager/notification-history";
  
  const fetchUnreadCount = async () => {
    if (!company?.id || !user?.id) return;
    try {
      const res = await fetch(`/api/notifications/unread-count?companyId=${company.id}&userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };
  
  const fetchNotifications = async () => {
    if (!company?.id || !user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?companyId=${company.id}&userId=${user.id}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };
  
  const markAllAsRead = async () => {
    if (!company?.id || !user?.id) return;
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, userId: user.id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };
  
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [company?.id, user?.id]);
  
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  
  if (!user || !company) return null;
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
        data-testid="button-notification-bell"
      >
        <Bell className="h-5 w-5 text-slate-500" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 transition-colors"
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No notifications yet</p>
                  <p className="text-sm text-slate-400 mt-1">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(notification => {
                    const priority = priorityConfig[notification.priority as keyof typeof priorityConfig] || priorityConfig.NORMAL;
                    const PriorityIcon = priority.icon;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notification.isRead ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => {
                          if (!notification.isRead) markAsRead(notification.id);
                          setIsOpen(false);
                          navigate(notificationsPath);
                        }}
                        data-testid={`notification-item-${notification.id}`}
                      >
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 h-8 w-8 rounded-lg ${priority.color} bg-opacity-10 flex items-center justify-center`}>
                            <PriorityIcon className={`h-4 w-4 ${priority.textColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`font-medium text-sm ${!notification.isRead ? "text-slate-900" : "text-slate-600"}`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1.5">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-100 p-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(notificationsPath);
                }}
                className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                data-testid="button-view-all-notifications"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}