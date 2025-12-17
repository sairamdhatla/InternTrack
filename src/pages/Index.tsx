import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Briefcase, LogOut } from 'lucide-react';

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
      <main className="container py-12">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            Welcome, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your dashboard is ready. Next feature: Application Tracker.
          </p>
          <div className="p-8 rounded-xl border border-border bg-card animate-fade-in">
            <p className="text-muted-foreground">
              Application tracking will be implemented in the next step.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
