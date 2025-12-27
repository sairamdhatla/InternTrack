import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Internship {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: string;
  applied_date: string;
  created_at: string;
  updated_at: string;
}

export interface InternshipInput {
  company: string;
  role: string;
  status?: string;
  applied_date?: string;
}

export function useInternships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInternships([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('internships')
        .select('*')
        .order('applied_date', { ascending: false });

      if (fetchError) throw fetchError;
      setInternships(data || []);
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch internships');
    } finally {
      setLoading(false);
    }
  }, []);

  const createInternship = useCallback(async (input: InternshipInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('internships')
        .insert({
          user_id: user.id,
          company: input.company,
          role: input.role,
          status: input.status || 'Applied',
          applied_date: input.applied_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setInternships(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating internship:', err);
      throw err;
    }
  }, []);

  const updateInternship = useCallback(async (id: string, input: Partial<InternshipInput>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('internships')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setInternships(prev => prev.map(i => i.id === id ? data : i));
      return data;
    } catch (err) {
      console.error('Error updating internship:', err);
      throw err;
    }
  }, []);

  const deleteInternship = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('internships')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setInternships(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting internship:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  return {
    internships,
    loading,
    error,
    fetchInternships,
    createInternship,
    updateInternship,
    deleteInternship,
  };
}
