import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
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
    label: 'Positive', 
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: TrendingUp,
  },
  warning: { 
    label: 'Warning', 
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: AlertTriangle,
  },
  insight: { 
    label: 'Insight', 
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
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
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Brain className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Career Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Add more applications to unlock career insights and patterns.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group insights by type for better organization
  const positiveInsights = insights.filter(i => i.type === 'positive');
  const warningInsights = insights.filter(i => i.type === 'warning');
  const generalInsights = insights.filter(i => i.type === 'insight');

  // Show balanced mix: positives first, then warnings, then insights
  const displayInsights = [
    ...positiveInsights.slice(0, 3),
    ...warningInsights.slice(0, 2),
    ...generalInsights.slice(0, 3),
  ].slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Brain className="h-5 w-5 text-primary" />
        <CardTitle className="text-base font-semibold">Career Insights</CardTitle>
        <Badge variant="secondary" className="ml-auto">
          {insights.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayInsights.map((insight) => {
          const typeConfig = TYPE_CONFIG[insight.type];
          const TypeIcon = typeConfig.icon;
          const CategoryIcon = CATEGORY_ICONS[insight.category] || Sparkles;
          
          return (
            <div 
              key={insight.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className={`mt-0.5 p-1.5 rounded-md ${typeConfig.badge}`}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-xs ${typeConfig.badge}`}>
                    {typeConfig.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CategoryIcon className="h-3 w-3" />
                    <span className="capitalize">{insight.category}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {insight.message}
                </p>
              </div>
              {insight.value && (
                <div className="shrink-0 text-right">
                  <span className={`text-sm font-semibold ${
                    insight.type === 'positive' ? 'text-emerald-600 dark:text-emerald-400' :
                    insight.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {insight.value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {insights.length > 6 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{insights.length - 6} more insights available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
