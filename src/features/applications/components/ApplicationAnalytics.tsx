import { useApplicationAnalytics } from '../hooks/useApplicationAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';

export function ApplicationAnalytics() {
  const { analytics, loading } = useApplicationAnalytics();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
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
    );
  }

  const { outcomeRate, conversionFunnel, totalEvents } = analytics;

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
      {/* Outcome Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{outcomeRate.accepted}%</div>
            <p className="text-xs text-muted-foreground">
              {conversionFunnel.accepted} applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{outcomeRate.rejected}%</div>
            <p className="text-xs text-muted-foreground">
              of all applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{outcomeRate.pending}%</div>
            <p className="text-xs text-muted-foreground">
              still active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FunnelRow 
              label="Applied" 
              count={conversionFunnel.applied} 
              total={conversionFunnel.applied}
            />
            <FunnelRow 
              label="Reached OA" 
              count={conversionFunnel.reachedOA} 
              total={conversionFunnel.applied}
            />
            <FunnelRow 
              label="Reached Interview" 
              count={conversionFunnel.reachedInterview} 
              total={conversionFunnel.applied}
            />
            <FunnelRow 
              label="Received Offer" 
              count={conversionFunnel.reachedOffer} 
              total={conversionFunnel.applied}
            />
            <FunnelRow 
              label="Accepted" 
              count={conversionFunnel.accepted} 
              total={conversionFunnel.applied}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FunnelRow({ label, count, total }: { label: string; count: number; total: number }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
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
