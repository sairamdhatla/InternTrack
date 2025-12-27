import { Bell, CheckCheck, Clock, AlertTriangle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications, Notification } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  userId: string | undefined;
  compact?: boolean;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead,
  compact = false,
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
  compact?: boolean;
}) {
  const isUnread = !notification.read_at;
  const Icon = notification.type === 'interview_reminder' ? Clock : AlertTriangle;

  return (
    <div 
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
        isUnread 
          ? 'bg-[#4F46E5]/5 border-[#4F46E5]/20 dark:bg-primary/10' 
          : 'bg-muted/30 border-border/50'
      }`}
    >
      <div className={`p-2 rounded-lg shrink-0 ${
        notification.type === 'interview_reminder' 
          ? 'bg-blue-500/10 text-blue-500' 
          : 'bg-amber-500/10 text-amber-500'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {isUnread && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onMarkAsRead(notification.id)}
          className="shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <CheckCheck className="h-4 w-4 text-emerald-500" />
        </Button>
      )}
    </div>
  );
}

export function NotificationList({ userId, compact = false }: NotificationListProps) {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // For compact mode, show limited notifications inline
  if (compact) {
    const displayNotifications = notifications.slice(0, 3);
    
    if (displayNotifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No alerts right now</p>
          <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {displayNotifications.map((notification) => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
            onMarkAsRead={markAsRead}
            compact
          />
        ))}
        {notifications.length > 3 && (
          <p className="text-xs text-muted-foreground text-center pt-2 font-medium">
            +{notifications.length - 3} more notifications
          </p>
        )}
      </div>
    );
  }

  // Full notification list for standalone use
  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            Mark all as read
          </Button>
        </div>
      )}
      
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onMarkAsRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
