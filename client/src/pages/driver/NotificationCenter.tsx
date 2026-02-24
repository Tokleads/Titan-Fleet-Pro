// Driver Notification Center
// View and manage push notifications

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { pushNotificationService } from '@/services/pushNotifications';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Notification {
  id: number;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  clickAction?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export default function NotificationCenter() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Get user ID from session (placeholder - implement your auth)
  const userId = 1; // TODO: Get from auth context

  useEffect(() => {
    loadNotifications();
    checkSubscriptionStatus();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications/history/${userId}`, { headers: authHeaders() });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = () => {
    setIsSubscribed(pushNotificationService.isSubscribed());
  };

  const handleSubscribe = async () => {
    try {
      const token = await pushNotificationService.subscribe(userId, 'driver');
      
      if (token) {
        setIsSubscribed(true);
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications in your browser settings',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive'
      });
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await pushNotificationService.unsubscribe(userId);
      setIsSubscribed(false);
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications',
      });
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: authHeaders()
      });

      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/read-all/${userId}`, {
        method: 'POST',
        headers: authHeaders()
      });

      setNotifications(notifications.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      
      toast({
        title: 'All Read',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      setNotifications(notifications.filter(n => n.id !== notificationId));
      
      toast({
        title: 'Deleted',
        description: 'Notification deleted',
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.clickAction) {
      if (notification.clickAction.startsWith('tel:')) {
        window.location.href = notification.clickAction;
      } else {
        window.location.href = notification.clickAction;
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Manage your push notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications even when app is closed
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleSubscribe();
                  } else {
                    handleUnsubscribe();
                  }
                }}
              />
            </div>

            {isSubscribed && (
              <div className="pt-4 border-t">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications are enabled
                </p>
              </div>
            )}

            {!isSubscribed && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <BellOff className="h-4 w-4" />
                  Enable notifications to receive important updates
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                You don't have any notifications yet
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {notification.icon ? (
                      <img
                        src={notification.icon}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{notification.title}</h3>
                      {!notification.isRead && (
                        <Badge variant="default" className="flex-shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.body}
                    </p>
                    {notification.image && (
                      <img
                        src={notification.image}
                        alt=""
                        className="rounded-lg max-w-full h-auto mb-2"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
