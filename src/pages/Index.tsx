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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen app-background">
      {/* Animated depth layer for premium background */}
      <div className="app-depth-layer" />
      {/* Header - Professional, minimal */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground">InternTrack</h1>
              {isPro && (
                <Badge variant="secondary" className="text-xs font-medium">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link to="/pricing">{isPro ? "Manage" : "Upgrade"}</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Overview Section */}
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Overview</h2>
              <span className="text-sm text-muted-foreground">
                {applications.length} total applications
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Applications */}
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {todaySnapshot.totalApps}
                  </p>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-xs text-muted-foreground mt-1">{todaySnapshot.activeApps} active</p>
                </CardContent>
              </Card>

              {/* Interviews */}
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {todaySnapshot.interviews}
                  </p>
                  <p className="text-sm text-muted-foreground">Interviews</p>
                  <p className="text-xs text-muted-foreground mt-1">in progress</p>
                </CardContent>
              </Card>

              {/* Deadlines */}
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className={`text-2xl font-semibold tabular-nums ${
                    todaySnapshot.upcomingDeadlines > 0 ? 'text-amber-600' : 'text-foreground'
                  }`}>
                    {todaySnapshot.upcomingDeadlines}
                  </p>
                  <p className="text-sm text-muted-foreground">Deadlines</p>
                  <p className="text-xs text-muted-foreground mt-1">next 7 days</p>
                </CardContent>
              </Card>

              {/* Response Rate */}
              <Card className="border border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {todaySnapshot.responseRate}%
                  </p>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">got replies</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Suggestions & Alerts */}
          {((preferences?.smart_suggestions_enabled && suggestions.length > 0) || insights.length > 0) && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-semibold text-foreground mb-4">Suggested Actions</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {preferences?.smart_suggestions_enabled && (
                  <SmartSuggestionsPanel 
                    suggestions={suggestions}
                    onDismiss={dismissSuggestion}
                    onSnooze={snoozeSuggestion}
                    onMarkDone={handleMarkDone}
                    onAddNote={handleAddNote}
                  />
                )}
                <Card className="border border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <NotificationList userId={user?.id} compact />
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* Main Tabs */}
          <section className="animate-fade-in">
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-10 bg-muted/50 rounded-lg p-1">
                <TabsTrigger value="dashboard" className="text-sm rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="applications" className="text-sm rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Applications</span>
                </TabsTrigger>
                <TabsTrigger value="insights" className="text-sm rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Insights</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-sm rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Analytics Tab */}
              <TabsContent value="dashboard" className="mt-4 animate-fade-in">
                <Card className="border border-border bg-card">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="text-base font-medium">Performance</CardTitle>
                      <Tabs value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab}>
                        <TabsList className="h-8 bg-muted/50">
                          <TabsTrigger value="funnel" className="text-xs h-6 px-3">
                            <Activity className="h-3 w-3 mr-1" />
                            Funnel
                          </TabsTrigger>
                          <TabsTrigger value="platforms" className="text-xs h-6 px-3">
                            <PieChart className="h-3 w-3 mr-1" />
                            Platforms
                          </TabsTrigger>
                          <TabsTrigger value="timeline" className="text-xs h-6 px-3">
                            <Clock className="h-3 w-3 mr-1" />
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
              <TabsContent value="applications" className="mt-4 space-y-4 animate-fade-in">
                <Card className="border border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base font-medium">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        New Application
                      </CardTitle>
                      {!isPro && (
                        <Badge variant="secondary" className="text-xs">
                          {getRemainingSlots()} of 10 left
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ApplicationForm onSubmit={createApplication} disabled={!canAddApplication()} />
                    {!canAddApplication() && !isPro && (
                      <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                        <p className="text-sm text-muted-foreground">
                          Free limit reached (10 applications)
                        </p>
                        <Button size="sm" asChild>
                          <Link to="/pricing">Upgrade</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle className="text-base font-medium">
                        Applications
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {filteredApplications.length}
                          {applications.length !== filteredApplications.length && ` / ${applications.length}`}
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
              <TabsContent value="insights" className="mt-4 animate-fade-in">
                {preferences?.career_insights_enabled && insights.length > 0 ? (
                  <CareerInsightsPanel insights={insights} />
                ) : (
                  <Card className="border border-border bg-card">
                    <CardContent className="py-12 text-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Add more applications to unlock insights</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-4 space-y-4 animate-fade-in">
                <div className="grid gap-4 lg:grid-cols-2">
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
