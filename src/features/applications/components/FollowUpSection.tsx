import { useState } from 'react';
import { format } from 'date-fns';
import { Send, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFollowUps, FollowUp } from '../hooks/useFollowUps';

interface FollowUpSectionProps {
  applicationId: string;
}

export function FollowUpSection({ applicationId }: FollowUpSectionProps) {
  const { followUps, isLoading, addFollowUp, isAdding } = useFollowUps(applicationId);
  const [note, setNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async () => {
    await addFollowUp({
      note: note.trim() || undefined,
      next_follow_up_date: nextFollowUpDate ? format(nextFollowUpDate, 'yyyy-MM-dd') : null,
    });
    setNote('');
    setNextFollowUpDate(undefined);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Follow-ups</h4>
        {!isFormOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Mark Follow-up Sent
          </Button>
        )}
      </div>

      {isFormOpen && (
        <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Note (optional)</label>
            <Textarea
              placeholder="E.g., Sent email to recruiter asking for update..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Next follow-up date (optional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !nextFollowUpDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {nextFollowUpDate ? format(nextFollowUpDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={nextFollowUpDate}
                  onSelect={setNextFollowUpDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isAdding}
              size="sm"
            >
              {isAdding ? 'Saving...' : 'Save Follow-up'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsFormOpen(false);
                setNote('');
                setNextFollowUpDate(undefined);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading follow-ups...</p>
      ) : followUps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No follow-ups logged yet.</p>
      ) : (
        <div className="space-y-2">
          {followUps.map((followUp: FollowUp) => (
            <div
              key={followUp.id}
              className="p-3 border border-border rounded-lg bg-secondary/30"
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  {followUp.note ? (
                    <p className="text-sm">{followUp.note}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Follow-up sent</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span>
                      Sent: {format(new Date(followUp.followed_up_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    {followUp.next_follow_up_date && (
                      <span className="text-primary">
                        Next: {format(new Date(followUp.next_follow_up_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
