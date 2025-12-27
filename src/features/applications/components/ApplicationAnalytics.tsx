import { useApplicationAnalytics } from '../hooks/useApplicationAnalytics';
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
      <div className="space-y-4">
        <Skeleton className="h-[280px] rounded-lg" />
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
      <div className="py-10 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No data yet. Start tracking to see analytics.</p>
      </div>
    );
  }

  // Render based on active tab
  if (activeTab === 'funnel') {
    return (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Conversion</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {outcomeRate.acceptedCount > 0 
              ? `${outcomeRate.accepted}% of applications converted to offers.`
              : `${responseRate}% of applications received responses.`
            }
          </p>
        </div>
        <ConversionChart data={conversionFunnel} />
      </div>
    );
  }

  if (activeTab === 'platforms') {
    return (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Platform Performance</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {platformMetrics.length > 0 
              ? `Most active on ${platformMetrics[0].platform} with ${platformMetrics[0].total} applications.`
              : 'Add platform info to see performance data.'
            }
          </p>
        </div>
        {platformMetrics.length > 0 ? (
          <PlatformChart data={platformMetrics} />
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No platform data available.
          </div>
        )}
        
        {/* Role Performance Table */}
        {roleMetrics.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              Role Performance
            </h4>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs font-medium">Role</TableHead>
                    <TableHead className="text-right text-xs font-medium">Apps</TableHead>
                    <TableHead className="text-right text-xs font-medium">Interviews</TableHead>
                    <TableHead className="text-right text-xs font-medium">Offers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleMetrics.slice(0, 5).map((item) => (
                    <TableRow key={item.role} className="hover:bg-muted/20">
                      <TableCell className="text-sm">{item.role}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{item.total}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          {item.reachedInterview}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-xs">
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
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Response Time</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {avgTimeToResponse > 0 
              ? `Average response time: ${avgTimeToResponse} days.`
              : 'Track more applications to see response times.'
            }
          </p>
        </div>
        <TimeInStatusChart data={timeInStatus} />
      </div>
    );
  }

  // Default: show funnel
  return (
    <div className="space-y-4">
      <ConversionChart data={conversionFunnel} />
    </div>
  );
}
