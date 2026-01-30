// Notification Badge Component
// Shows unread notification count in header/navigation

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface NotificationBadgeProps {
  userId: number;
  className?: string;
}

export function NotificationBadge({ userId, className }: NotificationBadgeProps) {
  const [, setLocation] = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch(`/api/notifications/unread-count/${userId}`);
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleClick = () => {
    setLocation('/driver/notifications');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`relative ${className}`}
      onClick={handleClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
