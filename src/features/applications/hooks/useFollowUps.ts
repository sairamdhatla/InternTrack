import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FollowUp {
  id: string;
  application_id: string;
  user_id: string;
  note: string | null;
  followed_up_at: string;
  next_follow_up_date: string | null;
  created_at: string;
}

export interface FollowUpInput {
  note?: string;
  next_follow_up_date?: string | null;
}

export function useFollowUps(applicationId: string) {
  const queryClient = useQueryClient();

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['follow-ups', applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('application_id', applicationId)
        .order('followed_up_at', { ascending: false });

      if (error) throw error;
      return data as FollowUp[];
    },
    enabled: !!applicationId,
  });

  const addFollowUp = useMutation({
    mutationFn: async (input: FollowUpInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert follow-up
      const { data, error } = await supabase
        .from('follow_ups')
        .insert({
          application_id: applicationId,
          user_id: user.id,
          note: input.note || null,
          next_follow_up_date: input.next_follow_up_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Log timeline event for follow-up sent
      await supabase
        .from('application_events')
        .insert({
          application_id: applicationId,
          user_id: user.id,
          event_type: 'follow_up_sent',
          new_status: input.note || null,
        });

      // Log timeline event for next follow-up scheduled
      if (input.next_follow_up_date) {
        await supabase
          .from('application_events')
          .insert({
            application_id: applicationId,
            user_id: user.id,
            event_type: 'next_follow_up_scheduled',
            new_status: input.next_follow_up_date,
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application-events', applicationId] });
      toast.success('Follow-up logged successfully');
    },
    onError: (error) => {
      toast.error('Failed to log follow-up');
      console.error('Follow-up error:', error);
    },
  });

  return {
    followUps,
    isLoading,
    addFollowUp: addFollowUp.mutateAsync,
    isAdding: addFollowUp.isPending,
  };
}
