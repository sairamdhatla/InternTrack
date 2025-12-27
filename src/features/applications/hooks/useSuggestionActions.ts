import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays } from 'date-fns';

interface SuggestionAction {
  id: string;
  user_id: string;
  suggestion_key: string;
  action_type: 'dismissed' | 'snoozed';
  snooze_until: string | null;
  created_at: string;
}

export function useSuggestionActions() {
  const [actions, setActions] = useState<SuggestionAction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('suggestion_actions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setActions((data as SuggestionAction[]) || []);
    } catch (error) {
      console.error('Error fetching suggestion actions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const dismissSuggestion = async (suggestionKey: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }

      const { error } = await supabase
        .from('suggestion_actions')
        .upsert({
          user_id: user.id,
          suggestion_key: suggestionKey,
          action_type: 'dismissed',
          snooze_until: null,
        }, { onConflict: 'user_id,suggestion_key' });

      if (error) throw error;
      
      toast.success('Suggestion dismissed');
      await fetchActions();
      return true;
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      toast.error('Failed to dismiss suggestion');
      return false;
    }
  };

  const snoozeSuggestion = async (suggestionKey: string, days: number): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }

      const snoozeUntil = addDays(new Date(), days).toISOString();

      const { error } = await supabase
        .from('suggestion_actions')
        .upsert({
          user_id: user.id,
          suggestion_key: suggestionKey,
          action_type: 'snoozed',
          snooze_until: snoozeUntil,
        }, { onConflict: 'user_id,suggestion_key' });

      if (error) throw error;
      
      toast.success(`Snoozed for ${days} days`);
      await fetchActions();
      return true;
    } catch (error) {
      console.error('Error snoozing suggestion:', error);
      toast.error('Failed to snooze suggestion');
      return false;
    }
  };

  const clearSnooze = async (suggestionKey: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('suggestion_actions')
        .delete()
        .eq('user_id', user.id)
        .eq('suggestion_key', suggestionKey);

      if (error) throw error;
      await fetchActions();
      return true;
    } catch (error) {
      console.error('Error clearing snooze:', error);
      return false;
    }
  };

  const isHidden = useCallback((suggestionKey: string): boolean => {
    const action = actions.find(a => a.suggestion_key === suggestionKey);
    if (!action) return false;
    
    if (action.action_type === 'dismissed') return true;
    
    if (action.action_type === 'snoozed' && action.snooze_until) {
      return new Date(action.snooze_until) > new Date();
    }
    
    return false;
  }, [actions]);

  return {
    actions,
    loading,
    dismissSuggestion,
    snoozeSuggestion,
    clearSnooze,
    isHidden,
    refetch: fetchActions,
  };
}
