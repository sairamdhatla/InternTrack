import { useMemo } from 'react';
import { format } from 'date-fns';
import { ArrowRight, StickyNote, Clock, Calendar, Bell, BellOff, Send, RotateCw } from 'lucide-react';
import { ApplicationNote } from '../hooks/useApplicationNotes';

interface ApplicationEvent {
  id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
}

interface TimelineItem {
  id: string;
  type: 'event' | 'note';
  eventType?: string;
  content: string;
  created_at: string;
  oldStatus?: string | null;
  newStatus?: string | null;
}

interface ApplicationTimelineProps {
  events: ApplicationEvent[];
  notes: ApplicationNote[];
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'deadline_set':
    case 'deadline_updated':
    case 'deadline_removed':
      return <Calendar className="h-4 w-4 text-primary" />;
    case 'reminder_enabled':
      return <Bell className="h-4 w-4 text-green-500" />;
    case 'reminder_disabled':
      return <BellOff className="h-4 w-4 text-muted-foreground" />;
    case 'follow_up_sent':
      return <Send className="h-4 w-4 text-blue-500" />;
    case 'next_follow_up_scheduled':
      return <RotateCw className="h-4 w-4 text-primary" />;
    default:
      return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
  }
}

function getEventMessage(event: TimelineItem): string {
  switch (event.eventType) {
    case 'deadline_set':
      return `Deadline set for ${event.newStatus ? format(new Date(event.newStatus), 'MMM d, yyyy') : 'unknown date'}`;
    case 'deadline_updated':
      return `Deadline updated to ${event.newStatus ? format(new Date(event.newStatus), 'MMM d, yyyy') : 'unknown date'}`;
    case 'deadline_removed':
      return 'Deadline removed';
    case 'reminder_enabled':
      return 'Reminder enabled';
    case 'reminder_disabled':
      return 'Reminder disabled';
    case 'follow_up_sent':
      return event.newStatus ? `📩 Follow-up sent: ${event.newStatus}` : '📩 Follow-up sent';
    case 'next_follow_up_scheduled':
      return `🔁 Next follow-up scheduled for ${event.newStatus ? format(new Date(event.newStatus), 'MMM d, yyyy') : 'unknown date'}`;
    case 'status_change':
      if (event.oldStatus && event.newStatus) {
        return `Status changed from ${event.oldStatus} to ${event.newStatus}`;
      }
      return 'Status changed';
    case 'created':
      return `Application created with status ${event.newStatus || 'Applied'}`;
    default:
      return event.eventType || 'Unknown event';
  }
}

export const ApplicationTimeline = ({ events, notes }: ApplicationTimelineProps) => {
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add events
    events.forEach((event) => {
      items.push({
        id: event.id,
        type: 'event',
        eventType: event.event_type,
        content: event.event_type,
        created_at: event.created_at,
        oldStatus: event.old_status,
        newStatus: event.new_status,
      });
    });

    // Add notes
    notes.forEach((note) => {
      items.push({
        id: note.id,
        type: 'note',
        content: note.content,
        created_at: note.created_at,
      });
    });

    // Sort by date descending (newest first)
    return items.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [events, notes]);

  if (timelineItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {timelineItems.map((item) => (
        <div 
          key={item.id} 
          className={`flex gap-3 p-3 rounded-lg border ${
            item.type === 'note' 
              ? 'bg-secondary/50 border-secondary' 
              : 'bg-muted/30 border-border'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {item.type === 'note' ? (
              <StickyNote className="h-4 w-4 text-primary" />
            ) : (
              getEventIcon(item.eventType || '')
            )}
          </div>
          <div className="flex-1 min-w-0">
            {item.type === 'note' ? (
              <p className="text-sm whitespace-pre-wrap break-words">{item.content}</p>
            ) : (
              <p className="text-sm">{getEventMessage(item)}</p>
            )}
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
