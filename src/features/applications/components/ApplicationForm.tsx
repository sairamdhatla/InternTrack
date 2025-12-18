import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    });
    setSubmitting(false);

    if (!result.error && !initialData) {
      setCompany('');
      setRole('');
      setPlatform('');
      setAppliedDate(new Date().toISOString().split('T')[0]);
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
