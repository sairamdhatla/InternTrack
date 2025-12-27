import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  Clock, 
  TrendingUp, 
  Briefcase,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  X,
  AlarmClockOff,
  Check,
  MessageSquarePlus,
  Loader2,
} from 'lucide-react';
import type { SmartSuggestion, SuggestionType, SuggestionPriority } from '../hooks/useSmartSuggestions';

interface SmartSuggestionsPanelProps {
  suggestions: SmartSuggestion[];
  onViewApplication?: (applicationId: string) => void;
  onDismiss?: (suggestionId: string) => Promise<boolean>;
  onSnooze?: (suggestionId: string, days: number) => Promise<boolean>;
  onMarkDone?: (applicationId: string) => Promise<boolean>;
  onAddNote?: (applicationId: string, note: string) => Promise<boolean>;
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

export function SmartSuggestionsPanel({ 
  suggestions, 
  onViewApplication,
  onDismiss,
  onSnooze,
  onMarkDone,
  onAddNote,
}: SmartSuggestionsPanelProps) {
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const setLoading = (id: string, loading: boolean) => {
    setLoadingActions(prev => ({ ...prev, [id]: loading }));
  };

  const handleDismiss = async (suggestionId: string) => {
    if (!onDismiss) return;
    setLoading(suggestionId, true);
    await onDismiss(suggestionId);
    setLoading(suggestionId, false);
  };

  const handleSnooze = async (suggestionId: string, days: number) => {
    if (!onSnooze) return;
    setLoading(suggestionId, true);
    await onSnooze(suggestionId, days);
    setLoading(suggestionId, false);
  };

  const handleMarkDone = async (applicationId: string, suggestionId: string) => {
    if (!onMarkDone) return;
    setLoading(suggestionId, true);
    await onMarkDone(applicationId);
    setLoading(suggestionId, false);
  };

  const handleAddNote = async (applicationId: string, suggestionId: string) => {
    if (!onAddNote) return;
    const note = noteInputs[suggestionId]?.trim();
    if (!note) return;
    
    setLoading(suggestionId, true);
    const success = await onAddNote(applicationId, note);
    if (success) {
      setNoteInputs(prev => ({ ...prev, [suggestionId]: '' }));
      setShowNoteInput(null);
    }
    setLoading(suggestionId, false);
  };

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
          const isLoading = loadingActions[suggestion.id];
          const hasApplication = !!suggestion.applicationId;
          
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
                
                {/* Note input */}
                {showNoteInput === suggestion.id && hasApplication && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add a quick note..."
                      value={noteInputs[suggestion.id] || ''}
                      onChange={(e) => setNoteInputs(prev => ({ ...prev, [suggestion.id]: e.target.value }))}
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && suggestion.applicationId) {
                          handleAddNote(suggestion.applicationId, suggestion.id);
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      className="h-8"
                      disabled={isLoading || !noteInputs[suggestion.id]?.trim()}
                      onClick={() => suggestion.applicationId && handleAddNote(suggestion.applicationId, suggestion.id)}
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => setShowNoteInput(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-2">
                  {suggestion.applicationId && onViewApplication && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs"
                      onClick={() => onViewApplication(suggestion.applicationId!)}
                    >
                      View
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                  
                  {(onDismiss || onSnooze || onMarkDone || onAddNote) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 ml-auto"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {hasApplication && onMarkDone && (
                          <DropdownMenuItem onClick={() => handleMarkDone(suggestion.applicationId!, suggestion.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Mark as done
                          </DropdownMenuItem>
                        )}
                        {hasApplication && onAddNote && (
                          <DropdownMenuItem onClick={() => setShowNoteInput(suggestion.id)}>
                            <MessageSquarePlus className="h-4 w-4 mr-2" />
                            Add quick note
                          </DropdownMenuItem>
                        )}
                        {onSnooze && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSnooze(suggestion.id, 3)}>
                              <AlarmClockOff className="h-4 w-4 mr-2" />
                              Snooze 3 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSnooze(suggestion.id, 7)}>
                              <AlarmClockOff className="h-4 w-4 mr-2" />
                              Snooze 7 days
                            </DropdownMenuItem>
                          </>
                        )}
                        {onDismiss && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDismiss(suggestion.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Dismiss
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
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
