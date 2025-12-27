import { useMemo } from 'react';
import { differenceInDays, parseISO, addDays } from 'date-fns';
import type { Application } from './useApplications';
import type { PlatformMetrics, RoleMetrics } from './useApplicationAnalytics';

export type SuggestionType = 'follow_up' | 'platform_insight' | 'role_insight' | 'deadline' | 'stale';
export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface SmartSuggestion {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  message: string;
  applicationId?: string;
  company?: string;
  role?: string;
  createdAt: Date;
}

const NON_FINAL_STATUSES = ['Applied', 'OA', 'Interview'];
const STALE_DAYS_THRESHOLD = 7;
const UPCOMING_DEADLINE_DAYS = 7;

interface UseSmartSuggestionsProps {
  applications: Application[];
  platformMetrics: PlatformMetrics[];
  roleMetrics: RoleMetrics[];
}

export function useSmartSuggestions({ 
  applications, 
  platformMetrics, 
  roleMetrics 
}: UseSmartSuggestionsProps) {
  const suggestions = useMemo<SmartSuggestion[]>(() => {
    const result: SmartSuggestion[] = [];
    const now = new Date();

    // 1. Stale applications - no update for 7+ days in non-final status
    applications.forEach((app) => {
      if (!NON_FINAL_STATUSES.includes(app.status)) return;
      
      const lastUpdate = parseISO(app.updated_at);
      const daysSinceUpdate = differenceInDays(now, lastUpdate);
      
      if (daysSinceUpdate >= STALE_DAYS_THRESHOLD) {
        result.push({
          id: `follow_up_${app.id}`,
          type: 'follow_up',
          priority: daysSinceUpdate >= 14 ? 'high' : 'medium',
          message: `Follow up on ${app.company} – ${app.role}. No updates for ${daysSinceUpdate} days.`,
          applicationId: app.id,
          company: app.company,
          role: app.role,
          createdAt: now,
        });
      }
    });

    // 2. Upcoming deadline suggestions
    applications.forEach((app) => {
      if (!app.deadline_date || !NON_FINAL_STATUSES.includes(app.status)) return;
      
      const deadline = parseISO(app.deadline_date);
      const daysUntilDeadline = differenceInDays(deadline, now);
      
      if (daysUntilDeadline >= 0 && daysUntilDeadline <= UPCOMING_DEADLINE_DAYS) {
        result.push({
          id: `deadline_${app.id}`,
          type: 'deadline',
          priority: daysUntilDeadline <= 2 ? 'high' : 'medium',
          message: daysUntilDeadline === 0 
            ? `Deadline TODAY for ${app.company} – ${app.role}!`
            : `Deadline in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''} for ${app.company} – ${app.role}.`,
          applicationId: app.id,
          company: app.company,
          role: app.role,
          createdAt: now,
        });
      }
    });

    // 3. Platform insights - find best performing platform
    if (platformMetrics.length >= 2) {
      const sortedByInterview = [...platformMetrics]
        .filter(p => p.total >= 2) // Only consider platforms with 2+ applications
        .sort((a, b) => b.interviewRate - a.interviewRate);
      
      if (sortedByInterview.length >= 1) {
        const bestPlatform = sortedByInterview[0];
        if (bestPlatform.interviewRate >= 30) { // Only suggest if interview rate is decent
          result.push({
            id: `platform_insight_${bestPlatform.platform}`,
            type: 'platform_insight',
            priority: 'low',
            message: `You have ${bestPlatform.interviewRate}% interview success on ${bestPlatform.platform}. Consider applying more there.`,
            createdAt: now,
          });
        }
      }
    }

    // 4. Role insights - find best performing role
    if (roleMetrics.length >= 2) {
      const sortedByConversion = [...roleMetrics]
        .filter(r => r.total >= 2) // Only consider roles with 2+ applications
        .sort((a, b) => b.conversionRate - a.conversionRate);
      
      if (sortedByConversion.length >= 1) {
        const bestRole = sortedByConversion[0];
        if (bestRole.conversionRate > 0 || bestRole.reachedInterview >= 2) {
          const message = bestRole.conversionRate > 0
            ? `Your success rate is higher for ${bestRole.role} roles (${bestRole.conversionRate}% accepted). Focus on similar roles.`
            : `${bestRole.role} roles have good traction with ${bestRole.reachedInterview} interviews. Keep applying!`;
          
          result.push({
            id: `role_insight_${bestRole.role}`,
            type: 'role_insight',
            priority: 'low',
            message,
            createdAt: now,
          });
        }
      }
    }

    // Sort by priority (high first) and then by type (follow_up and deadline first)
    const priorityOrder: Record<SuggestionPriority, number> = { high: 0, medium: 1, low: 2 };
    const typeOrder: Record<SuggestionType, number> = { 
      deadline: 0, 
      follow_up: 1, 
      stale: 2, 
      platform_insight: 3, 
      role_insight: 4 
    };
    
    result.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return result;
  }, [applications, platformMetrics, roleMetrics]);

  return { suggestions };
}
