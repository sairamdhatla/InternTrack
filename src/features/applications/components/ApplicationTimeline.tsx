import { useMemo } from 'react';
import { format } from 'date-fns';
import { ArrowRight, StickyNote, Clock } from 'lucide-react';
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
  content: string;
  created_at: string;
  oldStatus?: string | null;
  newStatus?: string | null;
}

interface ApplicationTimelineProps {
  events: ApplicationEvent[];
  notes: ApplicationNote[];
}

export const ApplicationTimeline = ({ events, notes }: ApplicationTimelineProps) => {
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add events
    events.forEach((event) => {
      items.push({
        id: event.id,
        type: 'event',
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
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {item.type === 'note' ? (
              <p className="text-sm whitespace-pre-wrap break-words">{item.content}</p>
            ) : (
              <p className="text-sm">
                <span className="font-medium">Status changed</span>
                {item.oldStatus && item.newStatus && (
                  <span className="text-muted-foreground">
                    {' '}from <span className="font-medium text-foreground">{item.oldStatus}</span> to{' '}
                    <span className="font-medium text-foreground">{item.newStatus}</span>
                  </span>
                )}
              </p>
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
