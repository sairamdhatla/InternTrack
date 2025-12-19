import { useMemo } from 'react';
import { useApplicationEvents, ApplicationEvent } from './useApplicationEvents';
import { APPLICATION_STATUSES, ApplicationStatus } from '../utils/statusStateMachine';

export interface StatusMetrics {
  status: ApplicationStatus;
  count: number;
  percentage: number;
}

export interface TransitionMetrics {
  from: ApplicationStatus;
  to: ApplicationStatus;
  count: number;
}

export interface ApplicationAnalytics {
  totalEvents: number;
  statusCounts: StatusMetrics[];
  transitionCounts: TransitionMetrics[];
  outcomeRate: {
    accepted: number;
    rejected: number;
    pending: number;
  };
  conversionFunnel: {
    applied: number;
    reachedOA: number;
    reachedInterview: number;
    reachedOffer: number;
    accepted: number;
  };
}

export function useApplicationAnalytics() {
  const { events, loading } = useApplicationEvents();

  const analytics = useMemo<ApplicationAnalytics>(() => {
    if (!events.length) {
      return {
        totalEvents: 0,
        statusCounts: APPLICATION_STATUSES.map(status => ({
          status,
          count: 0,
          percentage: 0,
        })),
        transitionCounts: [],
        outcomeRate: { accepted: 0, rejected: 0, pending: 0 },
        conversionFunnel: {
          applied: 0,
          reachedOA: 0,
          reachedInterview: 0,
          reachedOffer: 0,
          accepted: 0,
        },
      };
    }

    // Count transitions to each status from status_change events
    const statusTransitions = new Map<ApplicationStatus, number>();
    const transitionMap = new Map<string, number>();
    
    // Track unique applications that reached each stage
    const applicationStages = new Map<string, Set<ApplicationStatus>>();

    events.forEach((event) => {
      if (event.event_type === 'status_change' && event.new_status) {
        const newStatus = event.new_status as ApplicationStatus;
        statusTransitions.set(newStatus, (statusTransitions.get(newStatus) || 0) + 1);

        if (event.old_status) {
          const key = `${event.old_status}→${event.new_status}`;
          transitionMap.set(key, (transitionMap.get(key) || 0) + 1);
        }

        // Track which stages each application reached
        if (!applicationStages.has(event.application_id)) {
          applicationStages.set(event.application_id, new Set());
        }
        applicationStages.get(event.application_id)!.add(newStatus);
      }

      if (event.event_type === 'created') {
        if (!applicationStages.has(event.application_id)) {
          applicationStages.set(event.application_id, new Set());
        }
        applicationStages.get(event.application_id)!.add('Applied');
      }
    });

    // Calculate status counts
    const totalTransitions = Array.from(statusTransitions.values()).reduce((a, b) => a + b, 0);
    const statusCounts: StatusMetrics[] = APPLICATION_STATUSES.map(status => ({
      status,
      count: statusTransitions.get(status) || 0,
      percentage: totalTransitions > 0 
        ? Math.round(((statusTransitions.get(status) || 0) / totalTransitions) * 100)
        : 0,
    }));

    // Calculate transition counts
    const transitionCounts: TransitionMetrics[] = [];
    transitionMap.forEach((count, key) => {
      const [from, to] = key.split('→') as [ApplicationStatus, ApplicationStatus];
      transitionCounts.push({ from, to, count });
    });

    // Calculate outcome rates based on unique applications
    const totalApplications = applicationStages.size;
    let accepted = 0;
    let rejected = 0;
    
    applicationStages.forEach((stages) => {
      if (stages.has('Accepted')) accepted++;
      else if (stages.has('Rejected')) rejected++;
    });

    const pending = totalApplications - accepted - rejected;

    // Calculate conversion funnel
    let appliedCount = 0;
    let reachedOA = 0;
    let reachedInterview = 0;
    let reachedOffer = 0;
    let acceptedCount = 0;

    applicationStages.forEach((stages) => {
      appliedCount++;
      if (stages.has('OA') || stages.has('Interview') || stages.has('Offer') || stages.has('Accepted')) {
        reachedOA++;
      }
      if (stages.has('Interview') || stages.has('Offer') || stages.has('Accepted')) {
        reachedInterview++;
      }
      if (stages.has('Offer') || stages.has('Accepted')) {
        reachedOffer++;
      }
      if (stages.has('Accepted')) {
        acceptedCount++;
      }
    });

    return {
      totalEvents: events.length,
      statusCounts,
      transitionCounts,
      outcomeRate: {
        accepted: totalApplications > 0 ? Math.round((accepted / totalApplications) * 100) : 0,
        rejected: totalApplications > 0 ? Math.round((rejected / totalApplications) * 100) : 0,
        pending: totalApplications > 0 ? Math.round((pending / totalApplications) * 100) : 0,
      },
      conversionFunnel: {
        applied: appliedCount,
        reachedOA,
        reachedInterview,
        reachedOffer,
        accepted: acceptedCount,
      },
    };
  }, [events]);

  return { analytics, loading };
}
