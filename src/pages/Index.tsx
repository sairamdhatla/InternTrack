import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useApplications, ApplicationForm, ApplicationList, ApplicationAnalytics } from '@/features/applications';
import { Button } from '@/components/ui/button';
import { Briefcase, LogOut, BarChart3 } from 'lucide-react';

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    applications,
    loading: appsLoading,
    createApplication,
    updateApplication,
    deleteApplication,
    transitionStatus,
    canAddApplication,
    getRemainingSlots,
  } = useApplications();

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-semibold text-foreground">
              InternTrack
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Analytics Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-display font-semibold text-foreground">
                Analytics
              </h2>
            </div>
            <ApplicationAnalytics />
          </section>

          {/* Add Application Section */}
          <section className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Add Application
              </h2>
              <span className="text-sm text-muted-foreground">
                {getRemainingSlots()} of 10 slots remaining
              </span>
            </div>
            <ApplicationForm
              onSubmit={createApplication}
              disabled={!canAddApplication()}
            />
            {!canAddApplication() && (
              <p className="mt-4 text-sm text-destructive">
                You've reached the free limit of 10 applications.
              </p>
            )}
          </section>

          {/* Applications List Section */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-4">
              Your Applications ({applications.length})
            </h2>
            <ApplicationList
              applications={applications}
              onUpdate={updateApplication}
              onDelete={deleteApplication}
              onTransitionStatus={transitionStatus}
              loading={appsLoading}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
