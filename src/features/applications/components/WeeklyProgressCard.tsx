import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, RefreshCw, Calendar, Send, Clock, Zap } from 'lucide-react';
import { useWeeklyProgress } from '../hooks/useWeeklyProgress';

interface WeeklyProgressCardProps {
  userId: string | undefined;
}

export function WeeklyProgressCard({ userId }: WeeklyProgressCardProps) {
  const { progress, isLoading } = useWeeklyProgress(userId);

  const stats = [
    {
      label: 'Apps Added',
      value: progress.applicationsAdded,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Status Updates',
      value: progress.statusChanges,
      icon: RefreshCw,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Interviews',
      value: progress.interviewsScheduled,
      icon: Calendar,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Follow-ups',
      value: progress.followUpsSent,
      icon: Send,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Deadlines',
      value: progress.upcomingDeadlines,
      icon: Clock,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  ];

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span>Weekly Activity</span>
          <span className="text-sm font-normal text-muted-foreground ml-auto">Last 7 days</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border/50 transition-all duration-300 hover:border-border hover:shadow-card-hover hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`p-2 rounded-lg ${stat.bg} mb-2 transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className={`text-2xl font-bold font-display tabular-nums ${stat.color} animate-count-up`}>
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground text-center mt-1 font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
