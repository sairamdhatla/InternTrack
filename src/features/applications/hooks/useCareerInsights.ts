import { useMemo } from 'react';
import type { ApplicationAnalytics, PlatformMetrics, RoleMetrics, TimeInStatusMetrics } from './useApplicationAnalytics';

export type InsightType = 'positive' | 'warning' | 'insight';

export interface CareerInsight {
  id: string;
  type: InsightType;
  category: 'platform' | 'role' | 'timeline' | 'conversion' | 'general';
  message: string;
  value?: string | number;
}

interface UseCareerInsightsProps {
  analytics: ApplicationAnalytics;
}

export function useCareerInsights({ analytics }: UseCareerInsightsProps) {
  const insights = useMemo<CareerInsight[]>(() => {
    const result: CareerInsight[] = [];
    
    if (analytics.totalApplications === 0) {
      return result;
    }

    // Platform effectiveness insights
    generatePlatformInsights(analytics.platformMetrics, result);
    
    // Role success patterns
    generateRoleInsights(analytics.roleMetrics, result);
    
    // Timeline insights
    generateTimelineInsights(analytics, result);
    
    // Conversion & drop-off insights
    generateConversionInsights(analytics, result);
    
    // General performance insights
    generateGeneralInsights(analytics, result);

    return result;
  }, [analytics]);

  return { insights };
}

function generatePlatformInsights(platformMetrics: PlatformMetrics[], result: CareerInsight[]) {
  if (platformMetrics.length < 2) return;
  
  // Find best and worst performing platforms
  const platformsWithEnoughData = platformMetrics.filter(p => p.total >= 2);
  if (platformsWithEnoughData.length < 2) return;
  
  const sortedByInterview = [...platformsWithEnoughData].sort((a, b) => b.interviewRate - a.interviewRate);
  const best = sortedByInterview[0];
  const worst = sortedByInterview[sortedByInterview.length - 1];
  
  if (best.interviewRate > 0 && best.interviewRate >= worst.interviewRate + 15) {
    result.push({
      id: 'platform_best',
      type: 'positive',
      category: 'platform',
      message: `${best.platform} is your best platform with ${best.interviewRate}% interview rate.`,
      value: `${best.interviewRate}%`,
    });
  }
  
  if (worst.total >= 3 && worst.interviewRate === 0) {
    result.push({
      id: 'platform_worst',
      type: 'warning',
      category: 'platform',
      message: `${worst.platform} has 0% interview rate from ${worst.total} applications. Consider focusing elsewhere.`,
      value: '0%',
    });
  }
  
  // Platform with highest offer rate
  const sortedByOffer = [...platformsWithEnoughData].sort((a, b) => b.offerRate - a.offerRate);
  const bestOffer = sortedByOffer[0];
  if (bestOffer.offerRate > 0 && bestOffer.reachedOffer >= 2) {
    result.push({
      id: 'platform_offers',
      type: 'positive',
      category: 'platform',
      message: `${bestOffer.platform} has led to ${bestOffer.reachedOffer} offer${bestOffer.reachedOffer > 1 ? 's' : ''} (${bestOffer.offerRate}% rate).`,
      value: `${bestOffer.offerRate}%`,
    });
  }
}

function generateRoleInsights(roleMetrics: RoleMetrics[], result: CareerInsight[]) {
  if (roleMetrics.length === 0) return;
  
  const rolesWithEnoughData = roleMetrics.filter(r => r.total >= 2);
  
  // Find role with best conversion
  const sortedByConversion = [...rolesWithEnoughData].sort((a, b) => b.conversionRate - a.conversionRate);
  if (sortedByConversion.length > 0 && sortedByConversion[0].conversionRate > 0) {
    const best = sortedByConversion[0];
    result.push({
      id: 'role_best_conversion',
      type: 'positive',
      category: 'role',
      message: `${best.role} roles have your best conversion rate at ${best.conversionRate}%.`,
      value: `${best.conversionRate}%`,
    });
  }
  
  // Find role with highest interview rate
  const sortedByInterview = [...rolesWithEnoughData].sort((a, b) => {
    const aRate = a.total > 0 ? (a.reachedInterview / a.total) * 100 : 0;
    const bRate = b.total > 0 ? (b.reachedInterview / b.total) * 100 : 0;
    return bRate - aRate;
  });
  
  if (sortedByInterview.length > 0) {
    const best = sortedByInterview[0];
    const interviewRate = Math.round((best.reachedInterview / best.total) * 100);
    if (interviewRate >= 30) {
      result.push({
        id: 'role_high_interview',
        type: 'positive',
        category: 'role',
        message: `${best.role} roles get you ${interviewRate}% interview rate. This aligns well with your profile.`,
        value: `${interviewRate}%`,
      });
    }
  }
  
  // Role with most applications but low success
  const highVolumeLowSuccess = rolesWithEnoughData.find(r => r.total >= 5 && r.reachedInterview === 0);
  if (highVolumeLowSuccess) {
    result.push({
      id: 'role_low_success',
      type: 'warning',
      category: 'role',
      message: `${highVolumeLowSuccess.role} has ${highVolumeLowSuccess.total} applications but no interviews. Consider revising your approach.`,
      value: '0 interviews',
    });
  }
}

function generateTimelineInsights(analytics: ApplicationAnalytics, result: CareerInsight[]) {
  const { timeInStatus, responseRate, avgTimeToResponse } = analytics;
  
  // Response rate insight
  if (analytics.totalApplications >= 5) {
    if (responseRate >= 50) {
      result.push({
        id: 'response_rate_good',
        type: 'positive',
        category: 'timeline',
        message: `${responseRate}% of your applications received responses. You're getting noticed!`,
        value: `${responseRate}%`,
      });
    } else if (responseRate < 20) {
      result.push({
        id: 'response_rate_low',
        type: 'warning',
        category: 'timeline',
        message: `Only ${responseRate}% response rate. Consider improving resume or targeting different roles.`,
        value: `${responseRate}%`,
      });
    }
  }
  
  // Average response time
  if (avgTimeToResponse > 0 && analytics.totalApplications >= 3) {
    if (avgTimeToResponse <= 7) {
      result.push({
        id: 'response_time_fast',
        type: 'positive',
        category: 'timeline',
        message: `Average response time is ${avgTimeToResponse} days. Companies respond quickly to you!`,
        value: `${avgTimeToResponse} days`,
      });
    } else if (avgTimeToResponse > 21) {
      result.push({
        id: 'response_time_slow',
        type: 'insight',
        category: 'timeline',
        message: `Average ${avgTimeToResponse} days to hear back. Be patient and follow up after 2 weeks.`,
        value: `${avgTimeToResponse} days`,
      });
    }
  }
  
  // Time in Applied status
  const appliedStatus = timeInStatus.find(t => t.status === 'Applied');
  if (appliedStatus && appliedStatus.count >= 3) {
    if (appliedStatus.avgDays > 14) {
      result.push({
        id: 'applied_long_wait',
        type: 'insight',
        category: 'timeline',
        message: `Applications sit in 'Applied' for ~${Math.round(appliedStatus.avgDays)} days on average. Consider proactive follow-ups.`,
        value: `${Math.round(appliedStatus.avgDays)} days`,
      });
    }
  }
  
  // Interview stage duration
  const interviewStatus = timeInStatus.find(t => t.status === 'Interview');
  if (interviewStatus && interviewStatus.count >= 2) {
    result.push({
      id: 'interview_duration',
      type: 'insight',
      category: 'timeline',
      message: `Interview processes take ~${Math.round(interviewStatus.avgDays)} days on average for you.`,
      value: `${Math.round(interviewStatus.avgDays)} days`,
    });
  }
}

function generateConversionInsights(analytics: ApplicationAnalytics, result: CareerInsight[]) {
  const { conversionFunnel, outcomeRate, totalApplications } = analytics;
  
  if (totalApplications < 3) return;
  
  // Find biggest drop-off point
  for (let i = 1; i < conversionFunnel.length; i++) {
    const prev = conversionFunnel[i - 1];
    const curr = conversionFunnel[i];
    const dropoff = prev.percentage - curr.percentage;
    
    if (dropoff >= 50 && prev.count >= 3) {
      result.push({
        id: `dropoff_${curr.stage.toLowerCase()}`,
        type: 'warning',
        category: 'conversion',
        message: `${dropoff}% drop-off from ${prev.stage} to ${curr.stage}. This is your biggest conversion gap.`,
        value: `${dropoff}%`,
      });
      break;
    }
  }
  
  // Good conversion at specific stage
  const oaToInterview = conversionFunnel.find(f => f.stage === 'OA');
  const interview = conversionFunnel.find(f => f.stage === 'Interview');
  if (oaToInterview && interview && oaToInterview.count >= 2) {
    const oaConversion = oaToInterview.count > 0 ? Math.round((interview.count / oaToInterview.count) * 100) : 0;
    if (oaConversion >= 60) {
      result.push({
        id: 'oa_conversion_good',
        type: 'positive',
        category: 'conversion',
        message: `${oaConversion}% of OAs convert to interviews. Your assessment skills are strong!`,
        value: `${oaConversion}%`,
      });
    }
  }
  
  // Interview to offer conversion
  const offer = conversionFunnel.find(f => f.stage === 'Offer');
  if (interview && offer && interview.count >= 2) {
    const interviewToOffer = Math.round((offer.count / interview.count) * 100);
    if (interviewToOffer >= 40) {
      result.push({
        id: 'interview_to_offer_good',
        type: 'positive',
        category: 'conversion',
        message: `${interviewToOffer}% of interviews result in offers. You interview well!`,
        value: `${interviewToOffer}%`,
      });
    } else if (interviewToOffer < 20 && interview.count >= 5) {
      result.push({
        id: 'interview_to_offer_low',
        type: 'warning',
        category: 'conversion',
        message: `Only ${interviewToOffer}% of interviews lead to offers. Consider interview prep or feedback.`,
        value: `${interviewToOffer}%`,
      });
    }
  }
  
  // Rejection rate
  if (outcomeRate.rejectedCount >= 3) {
    if (outcomeRate.rejected > 60) {
      result.push({
        id: 'high_rejection',
        type: 'warning',
        category: 'conversion',
        message: `${outcomeRate.rejected}% rejection rate. Review your applications for improvement areas.`,
        value: `${outcomeRate.rejected}%`,
      });
    }
  }
  
  // Success rate
  if (outcomeRate.acceptedCount > 0) {
    result.push({
      id: 'acceptance_rate',
      type: 'positive',
      category: 'conversion',
      message: `${outcomeRate.accepted}% overall acceptance rate with ${outcomeRate.acceptedCount} offer${outcomeRate.acceptedCount > 1 ? 's' : ''} accepted!`,
      value: `${outcomeRate.accepted}%`,
    });
  }
}

function generateGeneralInsights(analytics: ApplicationAnalytics, result: CareerInsight[]) {
  const { totalApplications, platformMetrics, roleMetrics } = analytics;
  
  // Diversity of applications
  if (platformMetrics.length >= 3 && totalApplications >= 10) {
    result.push({
      id: 'platform_diversity',
      type: 'insight',
      category: 'general',
      message: `You're using ${platformMetrics.length} different platforms. Good diversification strategy!`,
      value: `${platformMetrics.length} platforms`,
    });
  }
  
  // Role focus
  if (roleMetrics.length === 1 && totalApplications >= 5) {
    result.push({
      id: 'role_focused',
      type: 'insight',
      category: 'general',
      message: `All ${totalApplications} applications are for ${roleMetrics[0].role}. Focused approach can be effective!`,
      value: roleMetrics[0].role,
    });
  } else if (roleMetrics.length > 5 && totalApplications >= 10) {
    result.push({
      id: 'role_scattered',
      type: 'insight',
      category: 'general',
      message: `You're applying to ${roleMetrics.length} different role types. Consider focusing on 2-3 primary roles.`,
      value: `${roleMetrics.length} roles`,
    });
  }
  
  // Application volume
  if (totalApplications >= 20) {
    result.push({
      id: 'high_volume',
      type: 'insight',
      category: 'general',
      message: `${totalApplications} applications tracked! Strong persistence in your job search.`,
      value: `${totalApplications}`,
    });
  }
}
