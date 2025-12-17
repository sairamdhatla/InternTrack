import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Briefcase } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (email: string, password: string) => {
    if (mode === 'login') {
      return signIn(email, password);
    }
    return signUp(email, password);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(195_85%_30%)_0%,hsl(195_85%_35%)_50%,hsl(165_60%_40%)_100%)]" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-primary-foreground">
              InternTrack
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-primary-foreground leading-tight mb-6">
            Track your path to your dream internship
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Organize applications, track progress, and land your next opportunity with confidence.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute top-20 -right-10 h-40 w-40 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              InternTrack
            </span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {mode === 'login'
                ? 'Sign in to continue tracking your applications'
                : 'Create an account to start tracking your internship applications'}
            </p>
          </div>

          <AuthForm
            mode={mode}
            onSubmit={handleSubmit}
            onToggleMode={() => setMode(mode === 'login' ? 'signup' : 'login')}
          />
        </div>
      </div>
    </div>
  );
}
