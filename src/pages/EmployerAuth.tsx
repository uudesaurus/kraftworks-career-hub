import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/kraftworks-logo.png';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || 'https://career.kraftworks.app';

export default function EmployerAuth() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://hiring.kraftworks.app';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/employer" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4">
        <a href={`${MAIN_APP_URL}/career-fair`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Career Fair
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8 sm:pb-12">
        <div className="w-full max-w-[90vw] sm:max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="Kraftworks" className="h-10 w-auto mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-heading font-bold text-foreground">
              {mode === 'sign-in' ? 'Employer Sign In' : 'Create Employer Account'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Post jobs and connect with trade professionals
            </p>
          </div>

          <div className="flex justify-center">
            <div style={{ width: '100%', maxWidth: '440px' }}>
              <div className="mx-auto" style={{ width: '100%', maxWidth: '420px' }}>
                {mode === 'sign-in' ? (
                  <SignIn
                    routing="hash"
                    forceRedirectUrl={`${currentOrigin}/employer`}
                    appearance={{
                      elements: {
                        rootBox: 'w-full',
                        card: 'shadow-lg border border-border rounded-xl w-full',
                      },
                    }}
                  />
                ) : (
                  <SignUp
                    routing="hash"
                    forceRedirectUrl={`${currentOrigin}/employer/register`}
                    appearance={{
                      elements: {
                        rootBox: 'w-full',
                        card: 'shadow-lg border border-border rounded-xl w-full',
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {mode === 'sign-in'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
