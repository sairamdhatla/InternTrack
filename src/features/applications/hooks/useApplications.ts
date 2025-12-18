import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FREE_USER_LIMIT = 10;

export interface Application {
  id: string;
  company: string;
  role: string;
  platform: string | null;
  status: string;
  applied_date: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationInput {
  company: string;
  role: string;
  platform?: string;
  status?: string;
  applied_date?: string;
}

export function useApplications() {
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
    return applications.length < FREE_USER_LIMIT;
  };

  const getRemainingSlots = () => {
    return Math.max(0, FREE_USER_LIMIT - applications.length);
  };

  const createApplication = async (input: ApplicationInput) => {
    if (!canAddApplication()) {
      toast({
        title: 'Limit Reached',
        description: `Free users can only track ${FREE_USER_LIMIT} applications.`,
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
      })
      .select()
      .single();

    if (insertError) {
      toast({ title: 'Error', description: insertError.message, variant: 'destructive' });
      return { error: insertError };
    }

    setApplications(prev => [data, ...prev]);
    toast({ title: 'Success', description: 'Application added' });
    return { data };
  };

  const updateApplication = async (id: string, input: Partial<ApplicationInput>) => {
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

    setApplications(prev => prev.map(app => app.id === id ? data : app));
    toast({ title: 'Success', description: 'Application updated' });
    return { data };
  };

  const deleteApplication = async (id: string) => {
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
    canAddApplication,
    getRemainingSlots,
    refresh: fetchApplications,
  };
}
