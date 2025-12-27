import { Bell, CheckCheck, Clock, AlertTriangle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      className={`group flex items-start gap-3 p-3 rounded-lg border transition-colors duration-150 ${
        isUnread 
          ? 'bg-primary/5 border-primary/10' 
          : 'bg-background border-border'
      }`}
    >
      <div className={`p-1.5 rounded-md shrink-0 ${
        notification.type === 'interview_reminder' 
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' 
          : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
      }`}>
        <Icon className="h-3.5 w-3.5" />
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
          className="shrink-0 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}

export function NotificationList({ userId, compact = false }: NotificationListProps) {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // For compact mode, show limited notifications inline
  if (compact) {
    const displayNotifications = notifications.slice(0, 3);
    
    if (displayNotifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Inbox className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No notifications</p>
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
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{notifications.length - 3} more
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
            {unreadCount} unread
          </p>
          <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs">
            Mark all read
          </Button>
        </div>
      )}
      
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No notifications</p>
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
