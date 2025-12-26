import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, RefreshCw, Calendar, Send, Clock } from 'lucide-react';
import { useWeeklyProgress } from '../hooks/useWeeklyProgress';

interface WeeklyProgressCardProps {
  userId: string | undefined;
}

export function WeeklyProgressCard({ userId }: WeeklyProgressCardProps) {
  const { progress, isLoading } = useWeeklyProgress(userId);

  const stats = [
    {
      label: 'Applications Added',
      value: progress.applicationsAdded,
      icon: TrendingUp,
    },
    {
      label: 'Status Changes',
      value: progress.statusChanges,
      icon: RefreshCw,
    },
    {
      label: 'Interviews Scheduled',
      value: progress.interviewsScheduled,
      icon: Calendar,
    },
    {
      label: 'Follow-ups Sent',
      value: progress.followUpsSent,
      icon: Send,
    },
    {
      label: 'Upcoming Deadlines',
      value: progress.upcomingDeadlines,
      icon: Clock,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Your Weekly Progress
        </CardTitle>
        <p className="text-sm text-muted-foreground">Last 7 days activity</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50 border border-border"
            >
              <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-2xl font-bold text-foreground">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
