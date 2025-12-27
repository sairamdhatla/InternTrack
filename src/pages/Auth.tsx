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
    <div className="flex min-h-screen auth-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white">
              InternTrack
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-semibold text-white leading-tight mb-6">
            Track your path to your dream internship
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Organize applications, track progress, and land your next opportunity with confidence.
          </p>
        </div>
        {/* Subtle decorative elements */}
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/[0.02]" />
        <div className="absolute top-20 -right-10 h-40 w-40 rounded-full bg-white/[0.02]" />
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/10">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">
              InternTrack
            </span>
          </div>

          {/* Auth Card */}
          <div className="auth-card p-8 lg:p-10">
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-2xl font-semibold text-foreground">
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
    </div>
  );
}
