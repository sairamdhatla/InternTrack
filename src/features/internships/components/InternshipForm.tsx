import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { InternshipInput } from '../hooks/useInternships';

interface InternshipFormProps {
  onSubmit: (data: InternshipInput) => Promise<void>;
  initialData?: Partial<InternshipInput>;
  onCancel?: () => void;
  disabled?: boolean;
}

const STATUS_OPTIONS = ['Applied', 'Screening', 'Interview', 'Offer', 'Accepted', 'Rejected'];

export function InternshipForm({ onSubmit, initialData, onCancel, disabled }: InternshipFormProps) {
  const [company, setCompany] = useState(initialData?.company || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [status, setStatus] = useState(initialData?.status || 'Applied');
  const [appliedDate, setAppliedDate] = useState<Date | undefined>(
    initialData?.applied_date ? new Date(initialData.applied_date) : new Date()
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit({
        company: company.trim(),
        role: role.trim(),
        status,
        applied_date: appliedDate ? format(appliedDate, 'yyyy-MM-dd') : undefined,
      });

      if (!initialData) {
        setCompany('');
        setRole('');
        setStatus('Applied');
        setAppliedDate(new Date());
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter company name"
            disabled={disabled || submitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Enter internship role"
            disabled={disabled || submitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus} disabled={disabled || submitting}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Applied Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !appliedDate && 'text-muted-foreground'
                )}
                disabled={disabled || submitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {appliedDate ? format(appliedDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={appliedDate}
                onSelect={setAppliedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={disabled || submitting || !company.trim() || !role.trim()}>
          {submitting ? 'Saving...' : initialData ? 'Update' : 'Add Internship'}
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
