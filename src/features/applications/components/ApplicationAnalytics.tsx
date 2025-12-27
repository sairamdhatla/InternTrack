import { useApplicationAnalytics } from '../hooks/useApplicationAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightCards } from './InsightCards';
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
import { Briefcase } from 'lucide-react';

export function ApplicationAnalytics() {
  const { analytics, loading } = useApplicationAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
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
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No analytics data yet. Start tracking applications to see insights.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <InsightCards
        totalApplications={totalApplications}
        responseRate={responseRate}
        avgTimeToResponse={avgTimeToResponse}
        outcomeRate={outcomeRate}
      />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <ConversionChart data={conversionFunnel} />
        <TimeInStatusChart data={timeInStatus} />
      </div>

      {/* Platform Performance */}
      {platformMetrics.length > 0 && (
        <PlatformChart data={platformMetrics} />
      )}

      {/* Role Performance Table */}
      {roleMetrics.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 p-6 pb-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold">Role Performance</h3>
          </div>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Interview</TableHead>
                  <TableHead className="text-right">Offer</TableHead>
                  <TableHead className="text-right">Accepted</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleMetrics.map((item) => (
                  <TableRow key={item.role}>
                    <TableCell className="font-medium">{item.role}</TableCell>
                    <TableCell className="text-right">{item.total}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-blue-500">{item.reachedInterview}</span>
                      <span className="text-muted-foreground ml-1">
                        ({item.total > 0 ? Math.round((item.reachedInterview / item.total) * 100) : 0}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-purple-500">{item.reachedOffer}</span>
                      <span className="text-muted-foreground ml-1">
                        ({item.total > 0 ? Math.round((item.reachedOffer / item.total) * 100) : 0}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-500">{item.accepted}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.conversionRate > 0 ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
                        {item.conversionRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
