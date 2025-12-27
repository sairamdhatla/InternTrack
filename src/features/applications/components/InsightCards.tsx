import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle, Timer } from 'lucide-react';

interface InsightCardsProps {
  totalApplications: number;
  responseRate: number;
  avgTimeToResponse: number;
  outcomeRate: {
    accepted: number;
    rejected: number;
    pending: number;
    acceptedCount: number;
    rejectedCount: number;
    pendingCount: number;
  };
}

export function InsightCards({ 
  totalApplications, 
  responseRate, 
  avgTimeToResponse, 
  outcomeRate 
}: InsightCardsProps) {
  const cards = [
    {
      title: 'Total Applications',
      value: totalApplications,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Response Rate',
      value: `${responseRate}%`,
      subtitle: 'got a response',
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Avg. Response Time',
      value: avgTimeToResponse > 0 ? `${avgTimeToResponse}d` : '-',
      subtitle: 'days to first response',
      icon: Timer,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Accepted',
      value: outcomeRate.acceptedCount,
      subtitle: `${outcomeRate.accepted}%`,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Rejected',
      value: outcomeRate.rejectedCount,
      subtitle: `${outcomeRate.rejected}%`,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Pending',
      value: outcomeRate.pendingCount,
      subtitle: `${outcomeRate.pending}%`,
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
