import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  public_profile_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (!data) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Pick<Profile, 'username' | 'display_name' | 'public_profile_enabled'>>) => {
    if (!userId) return { success: false, error: 'No user' };

    try {
      // Validate username if provided
      if (updates.username !== undefined) {
        const username = updates.username?.trim().toLowerCase();
        if (username && !/^[a-z0-9_-]{3,30}$/.test(username)) {
          toast.error('Username must be 3-30 characters, lowercase letters, numbers, dashes, or underscores');
          return { success: false, error: 'Invalid username format' };
        }
        updates.username = username || null;
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === '23505') {
          toast.error('Username is already taken');
          return { success: false, error: 'Username taken' };
        }
        throw updateError;
      }

      setProfile(data);
      toast.success('Profile updated');
      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update' };
    }
  };

  const getShareUrl = () => {
    if (!profile?.username) return null;
    return `${window.location.origin}/u/${profile.username}`;
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    getShareUrl,
    refetch: fetchProfile,
  };
}
