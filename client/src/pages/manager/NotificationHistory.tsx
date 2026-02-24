/**
 * Notification History Page
 * 
 * Shows a history of all sent notifications with filtering and search.
 */

import { useState, useEffect } from 'react';
import { ManagerLayout } from './ManagerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Search, Filter, Mail, MessageSquare, Smartphone, CheckCircle2, XCircle, Clock, Loader2, Trash2 } from 'lucide-react';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: number;
  type: string;
  channel: string;
  recipient: string;
  subject: string | null;
  message: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  metadata: any;
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
  const companyId = session.getCompany()?.id || 1;
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId: companyId.toString(),
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(channelFilter !== 'all' && { channel: channelFilter }),
        ...(searchQuery && { search: searchQuery })
      });
      
      const response = await fetch(`/api/notification-preferences/history?${params}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(data.history);
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load notifications on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, statusFilter, channelFilter, searchQuery, currentPage]);
  
  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      const response = await fetch(`/api/notification-preferences/history/${id}?companyId=${companyId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      toast({
        title: 'Success',
        description: 'Notification deleted successfully'
      });
      
      fetchNotifications();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  };
  
  // Filter notifications (API already filters)
  const filteredNotifications = notifications;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge variant="default" className="bg-green-500">Sent</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'IN_APP':
        return <Smartphone className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not sent';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification History</h1>
        <p className="text-muted-foreground">
          View all notifications sent to your team
        </p>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Notification Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="MOT_EXPIRY">MOT Expiry</SelectItem>
                <SelectItem value="TAX_EXPIRY">Tax Expiry</SelectItem>
                <SelectItem value="SERVICE_DUE">Service Due</SelectItem>
                <SelectItem value="LICENSE_EXPIRY">License Expiry</SelectItem>
                <SelectItem value="VOR_STATUS">VOR Status</SelectItem>
                <SelectItem value="DEFECT_REPORTED">Defect Reported</SelectItem>
                <SelectItem value="INSPECTION_FAILED">Inspection Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="IN_APP">In-App</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications ({filteredNotifications.length})
          </CardTitle>
          <CardDescription>
            {filteredNotifications.length === 0 ? 'No notifications found' : 'Recent notification activity'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No notifications found</p>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(notification.status)}
                          {getStatusBadge(notification.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(notification.channel)}
                          <span className="text-sm">{notification.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="font-medium">{notification.subject}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {notification.message}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{notification.recipient}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(notification.sentAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!loading && notifications.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
