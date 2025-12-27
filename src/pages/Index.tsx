import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { 
  useApplications, 
  useApplicationAnalytics,
  useSmartSuggestions,
  useSuggestionActions,
  useCareerInsights,
  ApplicationForm, 
  ApplicationList, 
  ApplicationAnalytics, 
  ApplicationFilters, 
  useApplicationFilters, 
  ExportButton,
  SmartSuggestionsPanel,
  CareerInsightsPanel
} from '@/features/applications';
import { NotificationList } from '@/features/notifications';
import { useSubscription } from '@/features/subscriptions';
import { ProfileSettings, PreferencesSection, useUserPreferences } from '@/features/profile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  LogOut, 
  Crown, 
  Plus,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  Bell,
  Settings,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  ChevronRight,
  User,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays, parseISO, isAfter, isBefore, addDays } from 'date-fns';

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { isPro } = useSubscription();
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('funnel');
  const [activeMainTab, setActiveMainTab] = useState('dashboard');
  
  const {
    applications,
    loading: appsLoading,
    createApplication,
    updateApplication,
    deleteApplication,
    transitionStatus,
    canAddApplication,
    getRemainingSlots,
  } = useApplications(isPro);

  const { filters, setFilters, filteredApplications, platforms } = useApplicationFilters(applications);
  const { analytics } = useApplicationAnalytics();
  const { preferences } = useUserPreferences(user?.id);
  const { dismissSuggestion, snoozeSuggestion, isHidden } = useSuggestionActions();
  
  const { suggestions: rawSuggestions } = useSmartSuggestions(
    preferences?.smart_suggestions_enabled ? {
      applications,
      platformMetrics: analytics.platformMetrics,
      roleMetrics: analytics.roleMetrics,
    } : { applications: [], platformMetrics: [], roleMetrics: [] }
  );
  
  const suggestions = useMemo(() => {
    if (!preferences?.smart_suggestions_enabled) return [];
    return rawSuggestions.filter(s => {
      if (isHidden(s.id)) return false;
      if (s.type === 'follow_up' && !preferences.follow_up_suggestions_enabled) return false;
      if ((s.type === 'platform_insight' || s.type === 'role_insight') && !preferences.insight_suggestions_enabled) return false;
      return true;
    });
  }, [rawSuggestions, preferences, isHidden]);
  
  const emptyAnalytics: typeof analytics = {
    totalEvents: 0,
    totalApplications: 0,
    conversionFunnel: [],
    platformMetrics: [],
    roleMetrics: [],
    companyMetrics: [],
    timeInStatus: [],
    outcomeRate: { accepted: 0, rejected: 0, pending: 0, acceptedCount: 0, rejectedCount: 0, pendingCount: 0 },
    responseRate: 0,
    avgTimeToResponse: 0,
  };
  
  const { insights } = useCareerInsights(
    preferences?.career_insights_enabled ? { analytics } : { analytics: emptyAnalytics }
  );

  // Calculate today's snapshot metrics
  const todaySnapshot = useMemo(() => {
    const now = new Date();
    const upcomingDeadlines = applications.filter(app => {
      if (!app.deadline_date || !app.reminder_enabled) return false;
      const deadline = parseISO(app.deadline_date);
      return isAfter(deadline, now) && isBefore(deadline, addDays(now, 7));
    }).length;

    const interviews = applications.filter(a => a.status === 'Interview').length;
    const activeApps = applications.filter(a => !['Rejected', 'Accepted'].includes(a.status)).length;

    return {
      totalApps: applications.length,
      activeApps,
      interviews,
      upcomingDeadlines,
      responseRate: analytics.responseRate,
    };
  }, [applications, analytics.responseRate]);

  const handleAddNote = useCallback(async (applicationId: string, note: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }
      const { error } = await supabase
        .from('application_notes')
        .insert({ application_id: applicationId, user_id: user.id, content: note.trim() });
      if (error) throw error;
      toast.success('Note added');
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
      return false;
    }
  }, []);

  const handleMarkDone = useCallback(async (applicationId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }
      const { error } = await supabase
        .from('follow_ups')
        .insert({ application_id: applicationId, user_id: user.id, note: 'Marked as done from Smart Suggestions' });
      if (error) throw error;
      await supabase.from('applications').update({ updated_at: new Date().toISOString() }).eq('id', applicationId);
      toast.success('Marked as followed up');
      return true;
    } catch (error) {
      console.error('Error marking as done:', error);
      toast.error('Failed to mark as done');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-white/80 dark:bg-card/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] shadow-lg shadow-[#4F46E5]/25">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">InternTrack</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Career Command Center</p>
            </div>
            {isPro && (
              <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
                <Crown className="h-3 w-3" />
                Pro
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
              <Link to="/pricing">{isPro ? "Manage Plan" : "Upgrade"}</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 lg:py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* ===== TODAY SNAPSHOT HERO ===== */}
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-[#4F46E5]" />
              <h2 className="text-lg font-display font-bold text-foreground">Today's Snapshot</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Applications */}
              <Card className="bg-white dark:bg-card border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Applications</p>
                      <p className="text-4xl font-bold font-display text-[#4F46E5] tabular-nums animate-count-up">
                        {todaySnapshot.totalApps}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{todaySnapshot.activeApps} active</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#4F46E5]/10 group-hover:bg-[#4F46E5]/15 transition-colors">
                      <Target className="h-6 w-6 text-[#4F46E5]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interviews */}
              <Card className="bg-white dark:bg-card border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Interviews</p>
                      <p className="text-4xl font-bold font-display text-amber-500 tabular-nums animate-count-up">
                        {todaySnapshot.interviews}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">in progress</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/15 transition-colors">
                      <Sparkles className="h-6 w-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deadlines */}
              <Card className="bg-white dark:bg-card border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Deadlines</p>
                      <p className={`text-4xl font-bold font-display tabular-nums animate-count-up ${
                        todaySnapshot.upcomingDeadlines > 0 ? 'text-rose-500' : 'text-emerald-500'
                      }`}>
                        {todaySnapshot.upcomingDeadlines}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">next 7 days</p>
                    </div>
                    <div className={`p-3 rounded-xl transition-colors ${
                      todaySnapshot.upcomingDeadlines > 0 ? 'bg-rose-500/10 group-hover:bg-rose-500/15' : 'bg-emerald-500/10 group-hover:bg-emerald-500/15'
                    }`}>
                      <Calendar className={`h-6 w-6 ${todaySnapshot.upcomingDeadlines > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Rate */}
              <Card className="bg-white dark:bg-card border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Response Rate</p>
                      <p className="text-4xl font-bold font-display text-emerald-500 tabular-nums animate-count-up">
                        {todaySnapshot.responseRate}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">got replies</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                      <TrendingUp className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ===== WHAT SHOULD I DO NEXT? ===== */}
          {((preferences?.smart_suggestions_enabled && suggestions.length > 0) || insights.length > 0) && (
            <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4">
                <ChevronRight className="h-5 w-5 text-[#4F46E5]" />
                <h2 className="text-lg font-display font-bold text-foreground">What should I do next?</h2>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* AI Career Coach - Smart Suggestions */}
                {preferences?.smart_suggestions_enabled && (
                  <SmartSuggestionsPanel 
                    suggestions={suggestions}
                    onDismiss={dismissSuggestion}
                    onSnooze={snoozeSuggestion}
                    onMarkDone={handleMarkDone}
                    onAddNote={handleAddNote}
                  />
                )}

                {/* Important Notifications */}
                <Card className="bg-white dark:bg-card border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10">
                        <Bell className="h-5 w-5 text-rose-500" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base font-display font-semibold">Important Alerts</CardTitle>
                        <p className="text-xs text-muted-foreground">Deadlines & reminders</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <NotificationList userId={user?.id} compact />
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* ===== MAIN TABS ===== */}
          <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-12 p-1.5 bg-white dark:bg-card shadow-sm rounded-xl border-0">
                <TabsTrigger value="dashboard" className="gap-2 rounded-lg data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="applications" className="gap-2 rounded-lg data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Applications</span>
                </TabsTrigger>
                <TabsTrigger value="insights" className="gap-2 rounded-lg data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Insights</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 rounded-lg data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Analytics Tab */}
              <TabsContent value="dashboard" className="mt-6 animate-fade-in">
                <Card className="bg-white dark:bg-card border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="text-lg font-display">Performance Analytics</CardTitle>
                      <Tabs value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab}>
                        <TabsList className="bg-muted/50 p-1">
                          <TabsTrigger value="funnel" className="text-xs gap-1.5">
                            <Activity className="h-3.5 w-3.5" />
                            Funnel
                          </TabsTrigger>
                          <TabsTrigger value="platforms" className="text-xs gap-1.5">
                            <PieChart className="h-3.5 w-3.5" />
                            Platforms
                          </TabsTrigger>
                          <TabsTrigger value="timeline" className="text-xs gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Timeline
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ApplicationAnalytics activeTab={activeAnalyticsTab} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="mt-6 space-y-6 animate-fade-in">
                <Card className="bg-white dark:bg-card border-0 shadow-md border-dashed border-2 border-[#4F46E5]/20 bg-gradient-to-br from-[#4F46E5]/5 to-transparent">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg font-display">
                        <Plus className="h-5 w-5 text-[#4F46E5]" />
                        Add New Application
                      </CardTitle>
                      {!isPro && (
                        <Badge variant="secondary" className="font-normal">
                          {getRemainingSlots()} of 10 remaining
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ApplicationForm onSubmit={createApplication} disabled={!canAddApplication()} />
                    {!canAddApplication() && !isPro && (
                      <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                          You've reached the free limit of 10 applications.
                        </p>
                        <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA]" asChild>
                          <Link to="/pricing">Upgrade to Pro</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-card border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="text-lg font-display">
                        Your Applications
                        <Badge variant="secondary" className="ml-2 font-normal">
                          {filteredApplications.length}
                          {applications.length !== filteredApplications.length && ` of ${applications.length}`}
                        </Badge>
                      </CardTitle>
                      <ExportButton />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ApplicationFilters filters={filters} onFiltersChange={setFilters} platforms={platforms} />
                    <ApplicationList
                      applications={filteredApplications}
                      userId={user?.id}
                      onUpdate={updateApplication}
                      onDelete={deleteApplication}
                      onTransitionStatus={transitionStatus}
                      loading={appsLoading}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="mt-6 animate-fade-in">
                {preferences?.career_insights_enabled && insights.length > 0 ? (
                  <CareerInsightsPanel insights={insights} />
                ) : (
                  <Card className="bg-white dark:bg-card border-0 shadow-md">
                    <CardContent className="py-12 text-center">
                      <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Add more applications to unlock career insights.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6 space-y-6 animate-fade-in">
                <div className="grid gap-6 lg:grid-cols-2">
                  <PreferencesSection userId={user?.id} />
                  <ProfileSettings userId={user?.id} />
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>
    </div>
  );
}
