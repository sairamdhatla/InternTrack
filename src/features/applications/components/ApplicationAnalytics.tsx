import { useApplicationAnalytics } from '../hooks/useApplicationAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Briefcase, Globe } from 'lucide-react';

export function ApplicationAnalytics() {
  const { analytics, loading } = useApplicationAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { conversionFunnel, platformMetrics, roleMetrics, totalEvents } = analytics;

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
      {/* Conversion Funnel */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversionFunnel.map((item) => (
              <FunnelRow
                key={item.stage}
                label={item.stage}
                count={item.count}
                percentage={item.percentage}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Success Rate */}
      {platformMetrics.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Platform Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Interview Rate</TableHead>
                  <TableHead className="text-right">Offer Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformMetrics.map((item) => (
                  <TableRow key={item.platform}>
                    <TableCell className="font-medium">{item.platform}</TableCell>
                    <TableCell className="text-right">{item.total}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">{item.reachedInterview}/</span>
                      {item.interviewRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">{item.reachedOffer}/</span>
                      {item.offerRate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Role Performance */}
      {roleMetrics.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Role Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Interview</TableHead>
                  <TableHead className="text-right">Offer</TableHead>
                  <TableHead className="text-right">Accepted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleMetrics.map((item) => (
                  <TableRow key={item.role}>
                    <TableCell className="font-medium">{item.role}</TableCell>
                    <TableCell className="text-right">{item.total}</TableCell>
                    <TableCell className="text-right">{item.reachedInterview}</TableCell>
                    <TableCell className="text-right">{item.reachedOffer}</TableCell>
                    <TableCell className="text-right">
                      {item.accepted}
                      <span className="text-muted-foreground ml-1">({item.conversionRate}%)</span>
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

function FunnelRow({ label, count, percentage }: { label: string; count: number; percentage: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
