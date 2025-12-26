import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Application, ApplicationInput } from '../hooks/useApplications';

interface ApplicationFormProps {
  onSubmit: (input: ApplicationInput) => Promise<{ error?: Error | unknown }>;
  initialData?: Application | null;
  onCancel?: () => void;
  disabled?: boolean;
}

export function ApplicationForm({ onSubmit, initialData, onCancel, disabled }: ApplicationFormProps) {
  const [company, setCompany] = useState(initialData?.company || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [platform, setPlatform] = useState(initialData?.platform || '');
  const [appliedDate, setAppliedDate] = useState(
    initialData?.applied_date || new Date().toISOString().split('T')[0]
  );
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    initialData?.deadline_date ? new Date(initialData.deadline_date) : undefined
  );
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminder_enabled || false);
  const [submitting, setSubmitting] = useState(false);

  // New applications always start with 'Applied' status
  // Status changes are handled via the status transition buttons
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    setSubmitting(true);
    const result = await onSubmit({
      company: company.trim(),
      role: role.trim(),
      platform: platform.trim() || undefined,
      // Only set status for new applications, not for edits (status changes via transition buttons)
      ...(initialData ? {} : { status: 'Applied' }),
      applied_date: appliedDate,
      deadline_date: deadlineDate ? format(deadlineDate, 'yyyy-MM-dd') : undefined,
      reminder_enabled: reminderEnabled,
    });
    setSubmitting(false);

    if (!result.error && !initialData) {
      setCompany('');
      setRole('');
      setPlatform('');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setDeadlineDate(undefined);
      setReminderEnabled(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            required
            disabled={disabled || submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Job title"
            required
            disabled={disabled || submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Input
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="LinkedIn, Indeed, etc."
            disabled={disabled || submitting}
          />
        </div>
        {initialData && (
          <div className="space-y-2">
            <Label>Current Status</Label>
            <p className="text-sm text-muted-foreground py-2">
              {initialData.status} <span className="text-xs">(change via status buttons in the table)</span>
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="applied_date">Applied Date</Label>
          <Input
            id="applied_date"
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            disabled={disabled || submitting}
          />
        </div>
        <div className="space-y-2">
          <Label>Deadline Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !deadlineDate && "text-muted-foreground"
                )}
                disabled={disabled || submitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadlineDate ? format(deadlineDate, "PPP") : <span>Set deadline (optional)</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={deadlineDate}
                onSelect={setDeadlineDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {deadlineDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setDeadlineDate(undefined)}
            >
              Clear deadline
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reminder">Enable Reminder</Label>
          <div className="flex items-center gap-2 pt-1">
            <Switch
              id="reminder"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              disabled={disabled || submitting || !deadlineDate}
            />
            <span className="text-sm text-muted-foreground">
              {deadlineDate ? (reminderEnabled ? 'Reminder on' : 'Reminder off') : 'Set deadline first'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={disabled || submitting || !company.trim() || !role.trim()}>
          {submitting ? 'Saving...' : initialData ? 'Update' : 'Add Application'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
