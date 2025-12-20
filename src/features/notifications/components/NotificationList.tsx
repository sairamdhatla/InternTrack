import { Bell, CheckCheck, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications, Notification } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  userId: string | undefined;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
}) {
  const isUnread = !notification.read_at;
  const Icon = notification.type === 'interview_reminder' ? Clock : AlertTriangle;

  return (
    <div 
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        isUnread ? 'bg-primary/5 border-primary/20' : 'bg-background border-border'
      }`}
    >
      <div className={`p-2 rounded-full ${
        notification.type === 'interview_reminder' 
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
          : 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
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
          className="shrink-0"
        >
          <CheckCheck className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function NotificationList({ userId }: NotificationListProps) {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {unreadCount}
            </span>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            Mark all as read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No notifications yet
          </p>
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
      </CardContent>
    </Card>
  );
}
