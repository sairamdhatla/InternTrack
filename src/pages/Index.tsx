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
  WeeklyProgressCard, 
  ExportButton,
  SmartSuggestionsPanel,
  CareerInsightsPanel
} from '@/features/applications';
import { NotificationList } from '@/features/notifications';
import { useSubscription } from '@/features/subscriptions';
import { ProfileSettings, PreferencesSection, useUserPreferences } from '@/features/profile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Briefcase, 
  LogOut, 
  BarChart3, 
  Bell, 
  Crown, 
  User, 
  Lightbulb, 
  Brain, 
  Settings,
  Plus,
  Sparkles,
  TrendingUp,
  Target,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { isPro, plan, isLoading: subLoading } = useSubscription();
  const [activeTab, setActiveTab] = useState('overview');
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
  const { preferences, loading: prefsLoading } = useUserPreferences(user?.id);
  const { dismissSuggestion, snoozeSuggestion, isHidden } = useSuggestionActions();
  
  // Smart suggestions based on applications and analytics - only compute if enabled
  const { suggestions: rawSuggestions } = useSmartSuggestions(
    preferences?.smart_suggestions_enabled ? {
      applications,
      platformMetrics: analytics.platformMetrics,
      roleMetrics: analytics.roleMetrics,
    } : { applications: [], platformMetrics: [], roleMetrics: [] }
  );
  
  // Filter suggestions based on preferences and dismissed/snoozed state
  const suggestions = useMemo(() => {
    if (!preferences?.smart_suggestions_enabled) return [];
    
    return rawSuggestions.filter(s => {
      if (isHidden(s.id)) return false;
      
      // Filter based on suggestion type preferences
      if (s.type === 'follow_up' && !preferences.follow_up_suggestions_enabled) return false;
      if ((s.type === 'platform_insight' || s.type === 'role_insight') && !preferences.insight_suggestions_enabled) return false;
      
      return true;
    });
  }, [rawSuggestions, preferences, isHidden]);
  
  // Career insights based on analytics - only compute if enabled
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

  // Handler for adding a note to an application
  const handleAddNote = useCallback(async (applicationId: string, note: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }

      const { error } = await supabase
        .from('application_notes')
        .insert({
          application_id: applicationId,
          user_id: user.id,
          content: note.trim()
        });

      if (error) throw error;
      toast.success('Note added');
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
      return false;
    }
  }, []);

  // Handler for marking an application as followed up
  const handleMarkDone = useCallback(async (applicationId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }

      const { error } = await supabase
        .from('follow_ups')
        .insert({
          application_id: applicationId,
          user_id: user.id,
          note: 'Marked as done from Smart Suggestions'
        });

      if (error) throw error;
      
      // Also touch the application to update the updated_at timestamp
      await supabase
        .from('applications')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      
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

  if (!user) {
    return null;
  }

  // Quick stats for header
  const activeApps = applications.filter(a => !['Rejected', 'Accepted'].includes(a.status)).length;
  const interviewCount = applications.filter(a => a.status === 'Interview').length;
  const offerCount = applications.filter(a => ['Offer', 'Accepted'].includes(a.status)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                InternTrack
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Career Command Center</p>
            </div>
            {isPro && (
              <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
                <Crown className="h-3 w-3" />
                Pro
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="btn-press hidden sm:flex" asChild>
              <Link to="/pricing">
                {isPro ? "Manage Plan" : "Upgrade"}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="btn-press" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 lg:py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Hero Stats Row */}
          <section className="animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="stat-card-value text-primary animate-count-up">{applications.length}</p>
                    <p className="stat-card-label">Total Apps</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="stat-card-value text-amber-500 animate-count-up">{activeApps}</p>
                    <p className="stat-card-label">Active</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="stat-card-value text-purple-500 animate-count-up">{interviewCount}</p>
                    <p className="stat-card-label">Interviews</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <FileText className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="stat-card-value text-emerald-500 animate-count-up">{offerCount}</p>
                    <p className="stat-card-label">Offers</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Weekly Progress */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <WeeklyProgressCard userId={user?.id} />
          </section>

          {/* AI Coach Section - Smart Suggestions + Career Insights */}
          {(preferences?.smart_suggestions_enabled && suggestions.length > 0) || 
           (preferences?.career_insights_enabled && insights.length > 0) ? (
            <section className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Smart Suggestions */}
                {preferences?.smart_suggestions_enabled && suggestions.length > 0 && (
                  <SmartSuggestionsPanel 
                    suggestions={suggestions}
                    onDismiss={dismissSuggestion}
                    onSnooze={snoozeSuggestion}
                    onMarkDone={handleMarkDone}
                    onAddNote={handleAddNote}
                  />
                )}

                {/* Career Insights */}
                {preferences?.career_insights_enabled && insights.length > 0 && (
                  <CareerInsightsPanel insights={insights} />
                )}
              </div>
            </section>
          ) : null}

          {/* Main Dashboard Tabs */}
          <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 lg:w-auto lg:inline-grid h-12 p-1 bg-muted/50">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="applications" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Applications</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6 animate-fade-in">
                <ApplicationAnalytics />
              </TabsContent>

              <TabsContent value="applications" className="mt-6 space-y-6 animate-fade-in">
                {/* Add Application Card */}
                <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg font-display">
                        <Plus className="h-5 w-5 text-primary" />
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
                    <ApplicationForm
                      onSubmit={createApplication}
                      disabled={!canAddApplication()}
                    />
                    {!canAddApplication() && !isPro && (
                      <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive font-medium">
                          You've reached the free limit of 10 applications.
                        </p>
                        <Button size="sm" className="btn-press" asChild>
                          <Link to="/pricing">Upgrade to Pro</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Applications List */}
                <Card>
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
                    <ApplicationFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      platforms={platforms}
                    />
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

              <TabsContent value="notifications" className="mt-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      <Bell className="h-5 w-5 text-primary" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <NotificationList userId={user?.id} />
                  </CardContent>
                </Card>
              </TabsContent>

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
