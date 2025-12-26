import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { canTransitionTo, getTransitionError, ApplicationStatus } from '../utils/statusStateMachine';

const FREE_USER_LIMIT = 10;

export interface Application {
  id: string;
  company: string;
  role: string;
  platform: string | null;
  status: string;
  applied_date: string;
  deadline_date: string | null;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationInput {
  company: string;
  role: string;
  platform?: string;
  status?: string;
  applied_date?: string;
  deadline_date?: string;
  reminder_enabled?: boolean;
}

export interface StatusTransitionResult {
  success: boolean;
  error?: string;
}

export function useApplications(isPro: boolean = false) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .order('applied_date', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      toast({ title: 'Error', description: fetchError.message, variant: 'destructive' });
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const canAddApplication = () => {
    if (isPro) return true;
    return applications.length < FREE_USER_LIMIT;
  };

  const getRemainingSlots = () => {
    if (isPro) return Infinity;
    return Math.max(0, FREE_USER_LIMIT - applications.length);
  };

  const createApplication = async (input: ApplicationInput) => {
    if (!canAddApplication()) {
      toast({
        title: 'Limit Reached',
        description: `Free users can only track ${FREE_USER_LIMIT} applications. Upgrade to Pro for unlimited.`,
        variant: 'destructive',
      });
      return { error: new Error('Application limit reached') };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    const { data, error: insertError } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        company: input.company,
        role: input.role,
        platform: input.platform || null,
        status: input.status || 'Applied',
        applied_date: input.applied_date || new Date().toISOString().split('T')[0],
        deadline_date: input.deadline_date || null,
        reminder_enabled: input.reminder_enabled || false,
      })
      .select()
      .single();

    if (insertError) {
      toast({ title: 'Error', description: insertError.message, variant: 'destructive' });
      return { error: insertError };
    }

    // Log creation event
    await supabase.from('application_events').insert({
      application_id: data.id,
      user_id: user.id,
      event_type: 'created',
      new_status: data.status,
    });

    // Log deadline set if provided
    if (input.deadline_date) {
      await supabase.from('application_events').insert({
        application_id: data.id,
        user_id: user.id,
        event_type: 'deadline_set',
        new_status: input.deadline_date,
      });
    }

    // Log reminder enabled if set
    if (input.reminder_enabled) {
      await supabase.from('application_events').insert({
        application_id: data.id,
        user_id: user.id,
        event_type: 'reminder_enabled',
      });
    }

    setApplications(prev => [data, ...prev]);
    toast({ title: 'Success', description: 'Application added' });
    return { data };
  };

  const updateApplication = async (id: string, input: Partial<ApplicationInput>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    // Get current application to check for changes
    const currentApp = applications.find(app => app.id === id);
    const oldStatus = currentApp?.status;
    const newStatus = input.status;
    const oldDeadline = currentApp?.deadline_date;
    const newDeadline = input.deadline_date;
    const oldReminderEnabled = currentApp?.reminder_enabled;
    const newReminderEnabled = input.reminder_enabled;

    // Validate status transition if status is being changed
    if (newStatus && oldStatus && newStatus !== oldStatus) {
      const transitionError = getTransitionError(oldStatus, newStatus);
      if (transitionError) {
        toast({ title: 'Invalid Status Change', description: transitionError, variant: 'destructive' });
        return { error: new Error(transitionError) };
      }
    }

    const { data, error: updateError } = await supabase
      .from('applications')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      toast({ title: 'Error', description: updateError.message, variant: 'destructive' });
      return { error: updateError };
    }

    // Log status change event if status changed
    if (newStatus && oldStatus !== newStatus) {
      await supabase.from('application_events').insert({
        application_id: id,
        user_id: user.id,
        event_type: 'status_change',
        old_status: oldStatus,
        new_status: newStatus,
      });
    }

    // Log deadline changes
    if (newDeadline !== undefined && newDeadline !== oldDeadline) {
      if (newDeadline) {
        await supabase.from('application_events').insert({
          application_id: id,
          user_id: user.id,
          event_type: oldDeadline ? 'deadline_updated' : 'deadline_set',
          old_status: oldDeadline || null,
          new_status: newDeadline,
        });
      } else if (oldDeadline) {
        await supabase.from('application_events').insert({
          application_id: id,
          user_id: user.id,
          event_type: 'deadline_removed',
          old_status: oldDeadline,
        });
      }
    }

    // Log reminder enabled/disabled
    if (newReminderEnabled !== undefined && newReminderEnabled !== oldReminderEnabled) {
      await supabase.from('application_events').insert({
        application_id: id,
        user_id: user.id,
        event_type: newReminderEnabled ? 'reminder_enabled' : 'reminder_disabled',
      });
    }

    setApplications(prev => prev.map(app => app.id === id ? data : app));
    toast({ title: 'Success', description: 'Application updated' });
    return { data };
  };

  const transitionStatus = async (id: string, newStatus: ApplicationStatus): Promise<StatusTransitionResult> => {
    const currentApp = applications.find(app => app.id === id);
    if (!currentApp) {
      return { success: false, error: 'Application not found' };
    }

    if (!canTransitionTo(currentApp.status, newStatus)) {
      const errorMsg = getTransitionError(currentApp.status, newStatus);
      toast({ title: 'Invalid Transition', description: errorMsg || 'Cannot change status', variant: 'destructive' });
      return { success: false, error: errorMsg || 'Invalid transition' };
    }

    const result = await updateApplication(id, { status: newStatus });
    if (result.error) {
      return { success: false, error: result.error instanceof Error ? result.error.message : 'Update failed' };
    }

    return { success: true };
  };

  const deleteApplication = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    // Get current application for logging
    const currentApp = applications.find(app => app.id === id);

    // Log deletion event before deleting (cascade will remove this event too, but it's logged)
    await supabase.from('application_events').insert({
      application_id: id,
      user_id: user.id,
      event_type: 'deleted',
      old_status: currentApp?.status,
    });

    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      toast({ title: 'Error', description: deleteError.message, variant: 'destructive' });
      return { error: deleteError };
    }

    setApplications(prev => prev.filter(app => app.id !== id));
    toast({ title: 'Success', description: 'Application deleted' });
    return { success: true };
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return {
    applications,
    loading,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
    transitionStatus,
    canAddApplication,
    getRemainingSlots,
    refresh: fetchApplications,
  };
}
