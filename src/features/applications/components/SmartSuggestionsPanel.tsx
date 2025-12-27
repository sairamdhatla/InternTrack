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
  Sparkles,
  Bot,
  Wand2,
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

const PRIORITY_STYLES: Record<SuggestionPriority, { badge: string; icon: string; border: string }> = {
  high: { 
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', 
    icon: 'text-rose-500',
    border: 'border-l-rose-500',
  },
  medium: { 
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', 
    icon: 'text-amber-500',
    border: 'border-l-amber-500',
  },
  low: { 
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', 
    icon: 'text-blue-500',
    border: 'border-l-blue-500',
  },
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  follow_up: 'Follow Up',
  deadline: 'Deadline',
  platform_insight: 'Insight',
  role_insight: 'Insight',
  stale: 'Action Needed',
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
      <Card className="bg-white dark:bg-card border-0 shadow-md overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/5 to-transparent pointer-events-none" />
        <CardHeader className="flex flex-row items-center gap-3 pb-2 relative">
          <div className="p-2.5 rounded-xl bg-[#4F46E5]/10">
            <Wand2 className="h-5 w-5 text-[#4F46E5]" />
          </div>
          <div>
            <CardTitle className="text-base font-display font-semibold">AI Career Coach</CardTitle>
            <p className="text-xs text-muted-foreground">Personalized guidance</p>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-[#4F46E5]/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-[#4F46E5]" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">You're all caught up!</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Keep tracking your applications for personalized tips.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-card border-0 shadow-md overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/5 to-transparent pointer-events-none" />
      <CardHeader className="flex flex-row items-center gap-3 pb-3 relative">
        <div className="p-2.5 rounded-xl bg-[#4F46E5]/10">
          <Wand2 className="h-5 w-5 text-[#4F46E5]" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base font-display font-semibold">AI Career Coach</CardTitle>
          <p className="text-xs text-muted-foreground">Personalized guidance</p>
        </div>
        <Badge className="bg-[#4F46E5] text-white border-0 font-semibold shadow-sm">
          {suggestions.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 relative">
        {suggestions.slice(0, 4).map((suggestion, index) => {
          const Icon = ICON_MAP[suggestion.type] || Info;
          const styles = PRIORITY_STYLES[suggestion.priority];
          const isLoading = loadingActions[suggestion.id];
          const hasApplication = !!suggestion.applicationId;
          
          return (
            <div 
              key={suggestion.id}
              className={`group flex items-start gap-3 p-4 rounded-xl bg-card border-l-4 ${styles.border} border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md animate-fade-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`mt-0.5 p-2 rounded-lg ${styles.badge} transition-transform group-hover:scale-105`}>
                <Icon className={`h-4 w-4 ${styles.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className={`text-xs font-medium ${styles.badge}`}>
                    {TYPE_LABELS[suggestion.type]}
                  </Badge>
                  {suggestion.priority === 'high' && (
                    <span className="flex items-center gap-1 text-xs text-rose-500 font-medium animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {suggestion.message}
                </p>
                
                {/* Note input */}
                {showNoteInput === suggestion.id && hasApplication && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Add a quick note..."
                      value={noteInputs[suggestion.id] || ''}
                      onChange={(e) => setNoteInputs(prev => ({ ...prev, [suggestion.id]: e.target.value }))}
                      className="h-9 text-sm rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && suggestion.applicationId) {
                          handleAddNote(suggestion.applicationId, suggestion.id);
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      className="h-9 bg-[#4F46E5] hover:bg-[#4338CA]"
                      disabled={isLoading || !noteInputs[suggestion.id]?.trim()}
                      onClick={() => suggestion.applicationId && handleAddNote(suggestion.applicationId, suggestion.id)}
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-9 px-2"
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
                      className="h-auto p-0 text-xs text-[#4F46E5]"
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
                          className="h-7 w-7 p-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
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
                            <Check className="h-4 w-4 mr-2 text-emerald-500" />
                            Mark as done
                          </DropdownMenuItem>
                        )}
                        {hasApplication && onAddNote && (
                          <DropdownMenuItem onClick={() => setShowNoteInput(suggestion.id)}>
                            <MessageSquarePlus className="h-4 w-4 mr-2 text-blue-500" />
                            Add quick note
                          </DropdownMenuItem>
                        )}
                        {onSnooze && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSnooze(suggestion.id, 3)}>
                              <AlarmClockOff className="h-4 w-4 mr-2 text-amber-500" />
                              Snooze 3 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSnooze(suggestion.id, 7)}>
                              <AlarmClockOff className="h-4 w-4 mr-2 text-amber-500" />
                              Snooze 7 days
                            </DropdownMenuItem>
                          </>
                        )}
                        {onDismiss && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDismiss(suggestion.id)}
                              className="text-rose-500 focus:text-rose-500"
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
        {suggestions.length > 4 && (
          <p className="text-xs text-muted-foreground text-center pt-1 font-medium">
            +{suggestions.length - 4} more suggestions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
