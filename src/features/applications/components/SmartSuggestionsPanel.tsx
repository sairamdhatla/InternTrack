import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  Clock, 
  TrendingUp, 
  Briefcase,
  Calendar,
  ExternalLink
} from 'lucide-react';
import type { SmartSuggestion, SuggestionType, SuggestionPriority } from '../hooks/useSmartSuggestions';

interface SmartSuggestionsPanelProps {
  suggestions: SmartSuggestion[];
  onViewApplication?: (applicationId: string) => void;
}

const ICON_MAP: Record<SuggestionType, React.ComponentType<{ className?: string }>> = {
  follow_up: Clock,
  deadline: Calendar,
  platform_insight: TrendingUp,
  role_insight: Briefcase,
  stale: AlertTriangle,
};

const PRIORITY_STYLES: Record<SuggestionPriority, { badge: string; icon: string }> = {
  high: { 
    badge: 'bg-destructive/10 text-destructive border-destructive/20', 
    icon: 'text-destructive' 
  },
  medium: { 
    badge: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', 
    icon: 'text-yellow-600 dark:text-yellow-400' 
  },
  low: { 
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', 
    icon: 'text-blue-600 dark:text-blue-400' 
  },
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  follow_up: 'Follow Up',
  deadline: 'Deadline',
  platform_insight: 'Insight',
  role_insight: 'Insight',
  stale: 'Stale',
};

export function SmartSuggestionsPanel({ suggestions, onViewApplication }: SmartSuggestionsPanelProps) {
  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Smart Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Lightbulb className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No suggestions right now. Keep tracking your applications!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <CardTitle className="text-base font-semibold">Smart Suggestions</CardTitle>
        <Badge variant="secondary" className="ml-auto">
          {suggestions.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.slice(0, 5).map((suggestion) => {
          const Icon = ICON_MAP[suggestion.type] || Info;
          const styles = PRIORITY_STYLES[suggestion.priority];
          
          return (
            <div 
              key={suggestion.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className={`mt-0.5 p-1.5 rounded-md ${styles.badge}`}>
                <Icon className={`h-4 w-4 ${styles.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-xs ${styles.badge}`}>
                    {TYPE_LABELS[suggestion.type]}
                  </Badge>
                  {suggestion.priority === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {suggestion.message}
                </p>
                {suggestion.applicationId && onViewApplication && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 mt-1 text-xs"
                    onClick={() => onViewApplication(suggestion.applicationId!)}
                  >
                    View application
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {suggestions.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{suggestions.length - 5} more suggestions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
