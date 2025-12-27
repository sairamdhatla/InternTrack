import { useApplicationAnalytics } from '../hooks/useApplicationAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversionChart } from './ConversionChart';
import { TimeInStatusChart } from './TimeInStatusChart';
import { PlatformChart } from './PlatformChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Briefcase, TrendingUp, Clock, BarChart3 } from 'lucide-react';

interface ApplicationAnalyticsProps {
  activeTab?: string;
}

export function ApplicationAnalytics({ activeTab = 'funnel' }: ApplicationAnalyticsProps) {
  const { analytics, loading } = useApplicationAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  const { 
    conversionFunnel, 
    platformMetrics, 
    roleMetrics, 
    timeInStatus,
    totalApplications,
    responseRate,
    avgTimeToResponse,
    outcomeRate,
    totalEvents 
  } = analytics;

  if (totalEvents === 0) {
    return (
      <div className="py-12 text-center">
        <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No analytics data yet. Start tracking applications to see insights.</p>
      </div>
    );
  }

  // Render based on active tab
  if (activeTab === 'funnel') {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Conversion Insight</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {outcomeRate.acceptedCount > 0 
              ? `You've converted ${outcomeRate.accepted}% of applications to offers. ${outcomeRate.accepted >= 10 ? 'Great job!' : 'Keep applying!'}`
              : `${responseRate}% of your applications received responses. Keep following up on pending ones.`
            }
          </p>
        </div>
        <ConversionChart data={conversionFunnel} />
      </div>
    );
  }

  if (activeTab === 'platforms') {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Platform Insight</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {platformMetrics.length > 0 
              ? `You're most active on ${platformMetrics[0].platform} with ${platformMetrics[0].total} applications.`
              : 'Add platform information to your applications to see platform performance.'
            }
          </p>
        </div>
        {platformMetrics.length > 0 ? (
          <PlatformChart data={platformMetrics} />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No platform data available yet.
          </div>
        )}
        
        {/* Role Performance Table */}
        {roleMetrics.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Role Performance
            </h4>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="text-right font-semibold">Apps</TableHead>
                    <TableHead className="text-right font-semibold">Interviews</TableHead>
                    <TableHead className="text-right font-semibold">Offers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleMetrics.slice(0, 5).map((item) => (
                    <TableRow key={item.role} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{item.role}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.total}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                          {item.reachedInterview}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          {item.reachedOffer}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'timeline') {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Timeline Insight</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {avgTimeToResponse > 0 
              ? `On average, companies respond within ${avgTimeToResponse} days. ${avgTimeToResponse <= 7 ? 'That\'s quick!' : 'Be patient and follow up after 2 weeks.'}`
              : 'Track more applications to see your average response time.'
            }
          </p>
        </div>
        <TimeInStatusChart data={timeInStatus} />
      </div>
    );
  }

  // Default: show all
  return (
    <div className="space-y-6">
      <ConversionChart data={conversionFunnel} />
    </div>
  );
}
