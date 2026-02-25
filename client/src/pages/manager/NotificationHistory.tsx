import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ManagerLayout } from './ManagerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Search, Filter, CheckCircle2, Circle, AlertTriangle, AlertOctagon, Info, Loader2, CheckCheck, ChevronRight } from 'lucide-react';
import { session } from "@/lib/session";
import { useToast } from '@/hooks/use-toast';

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface NotificationItem {
  id: number;
  companyId: number;
  recipientId: number;
  senderId: number | null;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  readAt: string | null;
  isBroadcast: boolean;
  createdAt: string;
}

export default function NotificationHistory() {
  return (
    <ManagerLayout>
      <NotificationHistoryContent />
    </ManagerLayout>
  );
}

function NotificationHistoryContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const user = session.getUser();
  const companyId = session.getCompany()?.id || 1;
  const userId = user?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');

  const getNotificationRoute = (notification: NotificationItem): string | null => {
    const title = (notification.title || '').toLowerCase();
    const msg = (notification.message || '').toLowerCase();
    if (title.includes('inspection') || title.includes('walk-around')) return '/manager/inspections';
    if (title.includes('defect')) return '/manager/defects';
    if (title.includes('mot') || title.includes('tax') || title.includes('service due') || title.includes('expir')) return '/manager/reminders';
    if (title.includes('fuel') || msg.includes('fuel')) return '/manager/fuel-intelligence';
    if (title.includes('vor')) return '/manager/fleet';
    if (title.includes('message') || title.includes('driver message')) return '/manager/titan-command';
    if (title.includes('timesheet') || title.includes('clock')) return '/manager/timesheets';
    return null;
  };

  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["all-notifications", companyId, userId],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?companyId=${companyId}&userId=${userId}&limit=200`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!companyId && !!userId,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ companyId, userId }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) return false;
      }
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
      if (readFilter === 'unread' && n.isRead) return false;
      if (readFilter === 'read' && !n.isRead) return false;
      return true;
    });
  }, [notifications, searchQuery, priorityFilter, readFilter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">High</Badge>;
      case 'NORMAL':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Normal</Badge>;
      case 'LOW':
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case 'HIGH':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'NORMAL':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-notifications"
              />
            </div>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger data-testid="select-priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger data-testid="select-read-filter">
                <SelectValue placeholder="Read Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications ({filteredNotifications.length})
          </CardTitle>
          <CardDescription>
            {filteredNotifications.length === 0 ? 'No notifications found' : 'Your recent notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No notifications found</p>
              <p className="text-muted-foreground">
                {searchQuery || priorityFilter !== 'all' || readFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer group ${
                    notification.isRead
                      ? 'bg-white border-slate-100 hover:bg-slate-50'
                      : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    if (!notification.isRead) markReadMutation.mutate(notification.id);
                    const route = getNotificationRoute(notification);
                    if (route) navigate(route);
                  }}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getPriorityIcon(notification.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-semibold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <Circle className="h-2 w-2 fill-blue-500 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm ${notification.isRead ? 'text-slate-500' : 'text-slate-600'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {getPriorityBadge(notification.priority)}
                      {notification.isBroadcast && (
                        <Badge variant="outline" className="text-xs">Broadcast</Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.isRead && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Read
                        </span>
                      )}
                    </div>
                  </div>
                  {getNotificationRoute(notification) && (
                    <div className="flex-shrink-0 self-center">
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
