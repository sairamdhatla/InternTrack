import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, addDays, startOfDay, endOfDay } from 'date-fns';

export interface WeeklyProgress {
  applicationsAdded: number;
  statusChanges: number;
  interviewsScheduled: number;
  followUpsSent: number;
  upcomingDeadlines: number;
}

export function useWeeklyProgress(userId: string | undefined) {
  const sevenDaysAgo = useMemo(() => startOfDay(subDays(new Date(), 7)).toISOString(), []);
  const now = useMemo(() => new Date().toISOString(), []);
  const sevenDaysFromNow = useMemo(() => endOfDay(addDays(new Date(), 7)).toISOString(), []);

  const { data: progress, isLoading } = useQuery({
    queryKey: ['weekly-progress', userId],
    queryFn: async (): Promise<WeeklyProgress> => {
      if (!userId) {
        return {
          applicationsAdded: 0,
          statusChanges: 0,
          interviewsScheduled: 0,
          followUpsSent: 0,
          upcomingDeadlines: 0,
        };
      }

      // Fetch applications added in last 7 days
      const { data: recentApps, error: appsError } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo);

      if (appsError) throw appsError;

      // Fetch events in last 7 days
      const { data: recentEvents, error: eventsError } = await supabase
        .from('application_events')
        .select('event_type, new_status')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo);

      if (eventsError) throw eventsError;

      // Fetch follow-ups sent in last 7 days
      const { data: recentFollowUps, error: followUpsError } = await supabase
        .from('follow_ups')
        .select('id')
        .eq('user_id', userId)
        .gte('followed_up_at', sevenDaysAgo);

      if (followUpsError) throw followUpsError;

      // Fetch upcoming deadlines in next 7 days
      const { data: upcomingDeadlines, error: deadlinesError } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .eq('reminder_enabled', true)
        .gte('deadline_date', now.split('T')[0])
        .lte('deadline_date', sevenDaysFromNow.split('T')[0]);

      if (deadlinesError) throw deadlinesError;

      // Calculate metrics
      const statusChanges = recentEvents?.filter(e => e.event_type === 'status_change').length || 0;
      const interviewsScheduled = recentEvents?.filter(e => e.new_status === 'Interview').length || 0;

      return {
        applicationsAdded: recentApps?.length || 0,
        statusChanges,
        interviewsScheduled,
        followUpsSent: recentFollowUps?.length || 0,
        upcomingDeadlines: upcomingDeadlines?.length || 0,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    progress: progress || {
      applicationsAdded: 0,
      statusChanges: 0,
      interviewsScheduled: 0,
      followUpsSent: 0,
      upcomingDeadlines: 0,
    },
    isLoading,
  };
}
