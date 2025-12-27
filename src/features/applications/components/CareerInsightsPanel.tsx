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
  glow: string;
}> = {
  positive: { 
    label: 'Strength', 
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: TrendingUp,
    glow: 'shadow-emerald-500/10',
  },
  warning: { 
    label: 'Attention', 
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: AlertTriangle,
    glow: 'shadow-amber-500/10',
  },
  insight: { 
    label: 'Insight', 
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Lightbulb,
    glow: 'shadow-blue-500/10',
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
      <Card className="ai-coach-card">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-display font-semibold">Career Insights</CardTitle>
            <p className="text-xs text-muted-foreground">Pattern analysis</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
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
    ...positiveInsights.slice(0, 2),
    ...warningInsights.slice(0, 2),
    ...generalInsights.slice(0, 2),
  ].slice(0, 4);

  return (
    <Card className="ai-coach-card overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base font-display font-semibold">Career Insights</CardTitle>
          <p className="text-xs text-muted-foreground">Pattern analysis</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold">
          {insights.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayInsights.map((insight, index) => {
          const typeConfig = TYPE_CONFIG[insight.type];
          const TypeIcon = typeConfig.icon;
          const CategoryIcon = CATEGORY_ICONS[insight.category] || Sparkles;
          
          return (
            <div 
              key={insight.id}
              className={`group flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 transition-all duration-200 hover:border-border hover:shadow-md ${typeConfig.glow} animate-fade-in`}
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
                  <span className={`text-lg font-bold font-display tabular-nums ${
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
        {insights.length > 4 && (
          <p className="text-xs text-muted-foreground text-center pt-1 font-medium">
            +{insights.length - 4} more insights available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
