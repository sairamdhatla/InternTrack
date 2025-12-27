import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Globe,
  Briefcase,
  Clock,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import type { CareerInsight, InsightType } from '../hooks/useCareerInsights';

interface CareerInsightsPanelProps {
  insights: CareerInsight[];
}

const TYPE_CONFIG: Record<InsightType, { 
  label: string; 
  badge: string; 
  icon: React.ComponentType<{ className?: string }>;
}> = {
  positive: { 
    label: 'Strength', 
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    icon: TrendingUp,
  },
  warning: { 
    label: 'Attention', 
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    icon: AlertTriangle,
  },
  insight: { 
    label: 'Insight', 
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    icon: Lightbulb,
  },
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  platform: Globe,
  role: Briefcase,
  timeline: Clock,
  conversion: ArrowDownRight,
  general: Sparkles,
};

export function CareerInsightsPanel({ insights }: CareerInsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Career Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">No insights yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add more applications to unlock patterns</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group insights by type for better organization
  const positiveInsights = insights.filter(i => i.type === 'positive');
  const warningInsights = insights.filter(i => i.type === 'warning');
  const generalInsights = insights.filter(i => i.type === 'insight');

  // Show balanced mix
  const displayInsights = [
    ...positiveInsights.slice(0, 2),
    ...warningInsights.slice(0, 2),
    ...generalInsights.slice(0, 2),
  ].slice(0, 5);

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Career Insights</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {insights.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayInsights.map((insight) => {
          const typeConfig = TYPE_CONFIG[insight.type];
          const TypeIcon = typeConfig.icon;
          const CategoryIcon = CATEGORY_ICONS[insight.category] || Sparkles;
          
          return (
            <div 
              key={insight.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background"
            >
              <div className={`mt-0.5 p-1.5 rounded-md ${typeConfig.badge}`}>
                <TypeIcon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-xs ${typeConfig.badge}`}>
                    {typeConfig.label}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CategoryIcon className="h-3 w-3" />
                    <span className="capitalize">{insight.category}</span>
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {insight.message}
                </p>
              </div>
              {insight.value && (
                <div className="shrink-0 text-right">
                  <span className="text-lg font-semibold tabular-nums text-foreground">
                    {insight.value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {insights.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{insights.length - 5} more insights
          </p>
        )}
      </CardContent>
    </Card>
  );
}
