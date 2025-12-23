import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApplicationNote {
  id: string;
  application_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const useApplicationNotes = (applicationId: string) => {
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('application_notes')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  const addNote = async (content: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add notes');
        return false;
      }

      const { error } = await supabase
        .from('application_notes')
        .insert({
          application_id: applicationId,
          user_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
      
      toast.success('Note added');
      await fetchNotes();
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
      return false;
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchNotes();
    }
  }, [applicationId, fetchNotes]);

  return { notes, loading, addNote, refetch: fetchNotes };
};
