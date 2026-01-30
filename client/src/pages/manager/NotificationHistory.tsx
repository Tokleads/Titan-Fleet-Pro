/**
 * Notification History Page
 * 
 * Shows a history of all sent notifications with filtering and search.
 */

import { useState } from 'react';
import { ManagerLayout } from './ManagerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Search, Filter, Mail, MessageSquare, Smartphone, CheckCircle2, XCircle, Clock } from 'lucide-react';

// Mock data
const mockNotifications = [
  {
    id: 1,
    type: 'MOT_EXPIRY',
    channel: 'EMAIL',
    recipient: 'manager@company.com',
    subject: 'MOT Expiry Alert - AB12 CDE',
    message: 'Vehicle AB12 CDE (Mercedes Sprinter) MOT expires in 7 days on 15/02/2026.',
    status: 'SENT',
    sentAt: '2026-01-30T09:00:00Z',
    metadata: { vehicleVRM: 'AB12 CDE', daysUntilExpiry: 7 }
  },
  {
    id: 2,
    type: 'DEFECT_REPORTED',
    channel: 'EMAIL',
    recipient: 'manager@company.com',
    subject: 'Defect Reported - XY34 FGH',
    message: 'New defect reported on XY34 FGH: Brake light not working (MEDIUM severity)',
    status: 'SENT',
    sentAt: '2026-01-30T08:30:00Z',
    metadata: { vehicleVRM: 'XY34 FGH', severity: 'MEDIUM' }
  },
  {
    id: 3,
    type: 'TAX_EXPIRY',
    channel: 'EMAIL',
    recipient: 'manager@company.com',
    subject: 'Tax Expiry Alert - CD56 HIJ',
    message: 'Vehicle CD56 HIJ (Ford Transit) tax expires in 14 days on 22/02/2026.',
    status: 'SENT',
    sentAt: '2026-01-29T09:00:00Z',
    metadata: { vehicleVRM: 'CD56 HIJ', daysUntilExpiry: 14 }
  },
  {
    id: 4,
    type: 'VOR_STATUS',
    channel: 'EMAIL',
    recipient: 'manager@company.com',
    subject: 'VOR Status Change - KL78 MNO',
    message: 'Vehicle KL78 MNO (Iveco Daily) is now OFF ROAD. Reason: Failed inspection',
    status: 'SENT',
    sentAt: '2026-01-28T14:20:00Z',
    metadata: { vehicleVRM: 'KL78 MNO', vorStatus: true }
  },
  {
    id: 5,
    type: 'SERVICE_DUE',
    channel: 'EMAIL',
    recipient: 'manager@company.com',
    subject: 'Service Due Alert - PQ90 RST',
    message: 'Vehicle PQ90 RST (Mercedes Actros) service is due in 5 days on 12/02/2026.',
    status: 'FAILED',
    sentAt: null,
    metadata: { vehicleVRM: 'PQ90 RST', daysUntilDue: 5 }
  }
];

export default function NotificationHistory() {
  return (
    <ManagerLayout>
      <NotificationHistoryContent />
    </ManagerLayout>
  );
}

function NotificationHistoryContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  
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
  
  // Filter notifications
  const filteredNotifications = mockNotifications.filter(notification => {
    const matchesSearch = 
      notification.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || notification.channel === channelFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesChannel;
  });
  
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
          {filteredNotifications.length === 0 ? (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
