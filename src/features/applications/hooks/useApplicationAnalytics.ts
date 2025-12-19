import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APPLICATION_STATUSES, ApplicationStatus } from '../utils/statusStateMachine';

export interface EventWithApplication {
  id: string;
  application_id: string;
  user_id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
  platform: string | null;
  role: string;
}

export interface FunnelMetrics {
  stage: string;
  count: number;
  percentage: number;
}

export interface PlatformMetrics {
  platform: string;
  total: number;
  reachedInterview: number;
  reachedOffer: number;
  interviewRate: number;
  offerRate: number;
}

export interface RoleMetrics {
  role: string;
  total: number;
  reachedInterview: number;
  reachedOffer: number;
  accepted: number;
  conversionRate: number;
}

export interface ApplicationAnalytics {
  totalEvents: number;
  conversionFunnel: FunnelMetrics[];
  platformMetrics: PlatformMetrics[];
  roleMetrics: RoleMetrics[];
  outcomeRate: {
    accepted: number;
    rejected: number;
    pending: number;
  };
}

export function useApplicationAnalytics() {
  const [events, setEvents] = useState<EventWithApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEventsWithApplications = async () => {
    setLoading(true);
    
    // Fetch events and join with applications to get platform and role
    const { data, error } = await supabase
      .from('application_events')
      .select(`
        id,
        application_id,
        user_id,
        event_type,
        old_status,
        new_status,
        created_at,
        applications!inner(platform, role)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const enrichedEvents: EventWithApplication[] = data.map((event: any) => ({
        id: event.id,
        application_id: event.application_id,
        user_id: event.user_id,
        event_type: event.event_type,
        old_status: event.old_status,
        new_status: event.new_status,
        created_at: event.created_at,
        platform: event.applications?.platform || null,
        role: event.applications?.role || 'Unknown',
      }));
      setEvents(enrichedEvents);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEventsWithApplications();
  }, []);

  const analytics = useMemo<ApplicationAnalytics>(() => {
    if (!events.length) {
      return {
        totalEvents: 0,
        conversionFunnel: [
          { stage: 'Applied', count: 0, percentage: 0 },
          { stage: 'OA', count: 0, percentage: 0 },
          { stage: 'Interview', count: 0, percentage: 0 },
          { stage: 'Offer', count: 0, percentage: 0 },
          { stage: 'Accepted', count: 0, percentage: 0 },
        ],
        platformMetrics: [],
        roleMetrics: [],
        outcomeRate: { accepted: 0, rejected: 0, pending: 0 },
      };
    }

    // Track stages reached per application with platform and role info
    const applicationData = new Map<string, {
      stages: Set<ApplicationStatus>;
      platform: string | null;
      role: string;
    }>();

    events.forEach((event) => {
      const appId = event.application_id;
      
      if (!applicationData.has(appId)) {
        applicationData.set(appId, {
          stages: new Set(),
          platform: event.platform,
          role: event.role,
        });
      }

      const appInfo = applicationData.get(appId)!;

      if (event.event_type === 'created') {
        appInfo.stages.add('Applied');
      }

      if (event.event_type === 'status_change' && event.new_status) {
        appInfo.stages.add(event.new_status as ApplicationStatus);
      }
    });

    const totalApplications = applicationData.size;

    // Calculate conversion funnel
    let appliedCount = 0;
    let oaCount = 0;
    let interviewCount = 0;
    let offerCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    applicationData.forEach(({ stages }) => {
      appliedCount++;
      if (stages.has('OA') || stages.has('Interview') || stages.has('Offer') || stages.has('Accepted')) {
        oaCount++;
      }
      if (stages.has('Interview') || stages.has('Offer') || stages.has('Accepted')) {
        interviewCount++;
      }
      if (stages.has('Offer') || stages.has('Accepted')) {
        offerCount++;
      }
      if (stages.has('Accepted')) {
        acceptedCount++;
      }
      if (stages.has('Rejected')) {
        rejectedCount++;
      }
    });

    const conversionFunnel: FunnelMetrics[] = [
      { stage: 'Applied', count: appliedCount, percentage: 100 },
      { stage: 'OA', count: oaCount, percentage: appliedCount > 0 ? Math.round((oaCount / appliedCount) * 100) : 0 },
      { stage: 'Interview', count: interviewCount, percentage: appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0 },
      { stage: 'Offer', count: offerCount, percentage: appliedCount > 0 ? Math.round((offerCount / appliedCount) * 100) : 0 },
      { stage: 'Accepted', count: acceptedCount, percentage: appliedCount > 0 ? Math.round((acceptedCount / appliedCount) * 100) : 0 },
    ];

    // Calculate platform metrics
    const platformGroups = new Map<string, {
      total: number;
      reachedInterview: number;
      reachedOffer: number;
    }>();

    applicationData.forEach(({ stages, platform }) => {
      const platformKey = platform || 'Other';
      
      if (!platformGroups.has(platformKey)) {
        platformGroups.set(platformKey, { total: 0, reachedInterview: 0, reachedOffer: 0 });
      }

      const group = platformGroups.get(platformKey)!;
      group.total++;

      if (stages.has('Interview') || stages.has('Offer') || stages.has('Accepted')) {
        group.reachedInterview++;
      }
      if (stages.has('Offer') || stages.has('Accepted')) {
        group.reachedOffer++;
      }
    });

    const platformMetrics: PlatformMetrics[] = Array.from(platformGroups.entries())
      .map(([platform, data]) => ({
        platform,
        total: data.total,
        reachedInterview: data.reachedInterview,
        reachedOffer: data.reachedOffer,
        interviewRate: data.total > 0 ? Math.round((data.reachedInterview / data.total) * 100) : 0,
        offerRate: data.total > 0 ? Math.round((data.reachedOffer / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Calculate role metrics
    const roleGroups = new Map<string, {
      total: number;
      reachedInterview: number;
      reachedOffer: number;
      accepted: number;
    }>();

    applicationData.forEach(({ stages, role }) => {
      const roleKey = role || 'Unknown';
      
      if (!roleGroups.has(roleKey)) {
        roleGroups.set(roleKey, { total: 0, reachedInterview: 0, reachedOffer: 0, accepted: 0 });
      }

      const group = roleGroups.get(roleKey)!;
      group.total++;

      if (stages.has('Interview') || stages.has('Offer') || stages.has('Accepted')) {
        group.reachedInterview++;
      }
      if (stages.has('Offer') || stages.has('Accepted')) {
        group.reachedOffer++;
      }
      if (stages.has('Accepted')) {
        group.accepted++;
      }
    });

    const roleMetrics: RoleMetrics[] = Array.from(roleGroups.entries())
      .map(([role, data]) => ({
        role,
        total: data.total,
        reachedInterview: data.reachedInterview,
        reachedOffer: data.reachedOffer,
        accepted: data.accepted,
        conversionRate: data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const pending = totalApplications - acceptedCount - rejectedCount;

    return {
      totalEvents: events.length,
      conversionFunnel,
      platformMetrics,
      roleMetrics,
      outcomeRate: {
        accepted: totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0,
        rejected: totalApplications > 0 ? Math.round((rejectedCount / totalApplications) * 100) : 0,
        pending: totalApplications > 0 ? Math.round((pending / totalApplications) * 100) : 0,
      },
    };
  }, [events]);

  return { analytics, loading, refresh: fetchEventsWithApplications };
}
