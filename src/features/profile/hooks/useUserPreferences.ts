import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserPreferences {
  id: string;
  user_id: string;
  smart_suggestions_enabled: boolean;
  follow_up_suggestions_enabled: boolean;
  insight_suggestions_enabled: boolean;
  career_insights_enabled: boolean;
  interview_reminders_enabled: boolean;
  deadline_reminders_enabled: boolean;
  inactivity_alerts_enabled: boolean;
  inactivity_alert_days: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  smart_suggestions_enabled: true,
  follow_up_suggestions_enabled: true,
  insight_suggestions_enabled: true,
  career_insights_enabled: true,
  interview_reminders_enabled: true,
  deadline_reminders_enabled: true,
  inactivity_alerts_enabled: true,
  inactivity_alert_days: 7,
};

export function useUserPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        // Create default preferences for new user
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: userId, ...DEFAULT_PREFERENCES })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs as UserPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async <K extends keyof Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>(
    key: K,
    value: UserPreferences[K]
  ): Promise<boolean> => {
    if (!preferences) return false;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', preferences.user_id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
      return true;
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
      return false;
    }
  };

  const updatePreferences = async (
    updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    if (!preferences) return false;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', preferences.user_id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      return false;
    }
  };

  return {
    preferences,
    loading,
    updatePreference,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
