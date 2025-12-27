import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Globe,
  Briefcase,
  Clock,
  ArrowDownRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { CareerInsight, InsightType } from '../hooks/useCareerInsights';

interface CareerInsightsPanelProps {
  insights: CareerInsight[];
}

const TYPE_CONFIG: Record<InsightType, { 
  label: string; 
  badge: string; 
  icon: React.ComponentType<{ className?: string }>;
  border: string;
}> = {
  positive: { 
    label: 'Strength', 
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: TrendingUp,
    border: 'border-l-emerald-500',
  },
  warning: { 
    label: 'Attention', 
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: AlertTriangle,
    border: 'border-l-amber-500',
  },
  insight: { 
    label: 'Insight', 
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Lightbulb,
    border: 'border-l-blue-500',
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
      <Card className="bg-white dark:bg-card border-0 shadow-md overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
        <CardHeader className="flex flex-row items-center gap-3 pb-2 relative">
          <div className="p-2.5 rounded-xl bg-purple-500/10">
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-base font-display font-semibold">Career Insights</CardTitle>
            <p className="text-xs text-muted-foreground">Pattern analysis</p>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-purple-500/10 p-4 mb-4">
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Insights unlocking...</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Add more applications to unlock career patterns.
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

  // Show balanced mix
  const displayInsights = [
    ...positiveInsights.slice(0, 2),
    ...warningInsights.slice(0, 2),
    ...generalInsights.slice(0, 2),
  ].slice(0, 5);

  return (
    <Card className="bg-white dark:bg-card border-0 shadow-md overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
      <CardHeader className="flex flex-row items-center gap-3 pb-3 relative">
        <div className="p-2.5 rounded-xl bg-purple-500/10">
          <Brain className="h-5 w-5 text-purple-500" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base font-display font-semibold">Career Insights</CardTitle>
          <p className="text-xs text-muted-foreground">Pattern analysis</p>
        </div>
        <Badge className="bg-purple-500 text-white border-0 font-semibold shadow-sm">
          {insights.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 relative">
        {displayInsights.map((insight, index) => {
          const typeConfig = TYPE_CONFIG[insight.type];
          const TypeIcon = typeConfig.icon;
          const CategoryIcon = CATEGORY_ICONS[insight.category] || Sparkles;
          
          return (
            <div 
              key={insight.id}
              className={`group flex items-start gap-3 p-4 rounded-xl bg-card border-l-4 ${typeConfig.border} border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md animate-fade-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`mt-0.5 p-2 rounded-lg ${typeConfig.badge} transition-transform group-hover:scale-105`}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className={`text-xs font-medium ${typeConfig.badge}`}>
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
                  <span className={`text-xl font-bold font-display tabular-nums ${
                    insight.type === 'positive' ? 'text-emerald-500' :
                    insight.type === 'warning' ? 'text-amber-500' :
                    'text-blue-500'
                  }`}>
                    {insight.value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {insights.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1 font-medium">
            +{insights.length - 5} more insights available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
