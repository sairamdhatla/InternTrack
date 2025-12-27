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
  Lightbulb,
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
    badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20', 
    icon: 'text-red-600 dark:text-red-400',
  },
  medium: { 
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', 
    icon: 'text-amber-600 dark:text-amber-400',
  },
  low: { 
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20', 
    icon: 'text-blue-600 dark:text-blue-400',
  },
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  follow_up: 'Follow Up',
  deadline: 'Deadline',
  platform_insight: 'Insight',
  role_insight: 'Insight',
  stale: 'Action',
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
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">No suggestions right now</p>
            <p className="text-xs text-muted-foreground mt-1">Keep tracking to get personalized tips</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {suggestions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.slice(0, 4).map((suggestion) => {
          const Icon = ICON_MAP[suggestion.type] || Info;
          const styles = PRIORITY_STYLES[suggestion.priority];
          const isLoading = loadingActions[suggestion.id];
          const hasApplication = !!suggestion.applicationId;
          
          return (
            <div 
              key={suggestion.id}
              className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-background transition-colors duration-150 hover:bg-muted/30"
            >
              <div className={`mt-0.5 p-1.5 rounded-md ${styles.badge}`}>
                <Icon className={`h-3.5 w-3.5 ${styles.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-xs ${styles.badge}`}>
                    {TYPE_LABELS[suggestion.type]}
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {suggestion.message}
                </p>
                
                {/* Note input */}
                {showNoteInput === suggestion.id && hasApplication && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add a note..."
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
                
                {/* Actions */}
                <div className="flex items-center gap-2 mt-2">
                  {suggestion.applicationId && onViewApplication && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-primary"
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
                          className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-3 w-3" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {hasApplication && onMarkDone && (
                          <DropdownMenuItem onClick={() => handleMarkDone(suggestion.applicationId!, suggestion.id)}>
                            <Check className="h-3 w-3 mr-2" />
                            Mark as done
                          </DropdownMenuItem>
                        )}
                        {hasApplication && onAddNote && (
                          <DropdownMenuItem onClick={() => setShowNoteInput(suggestion.id)}>
                            <MessageSquarePlus className="h-3 w-3 mr-2" />
                            Add note
                          </DropdownMenuItem>
                        )}
                        {onSnooze && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSnooze(suggestion.id, 3)}>
                              <AlarmClockOff className="h-3 w-3 mr-2" />
                              Snooze 3 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSnooze(suggestion.id, 7)}>
                              <AlarmClockOff className="h-3 w-3 mr-2" />
                              Snooze 7 days
                            </DropdownMenuItem>
                          </>
                        )}
                        {onDismiss && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDismiss(suggestion.id)}
                              className="text-muted-foreground"
                            >
                              <X className="h-3 w-3 mr-2" />
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
        {suggestions.length > 4 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{suggestions.length - 4} more
          </p>
        )}
      </CardContent>
    </Card>
  );
}
