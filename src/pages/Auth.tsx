import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/kraftworks-logo.png';

const Auth = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="Kraftworks" className="h-10 w-auto mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-heading font-bold text-foreground">
              {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === 'sign-in'
                ? 'Sign in to access your career tools'
                : 'Get started with AI-powered resume review and interview prep'}
            </p>
          </div>

          <div className="flex justify-center">
            {mode === 'sign-in' ? (
              <SignIn
                routing="hash"
                forceRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-lg border border-border rounded-xl',
                  },
                }}
              />
            ) : (
              <SignUp
                routing="hash"
                forceRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-lg border border-border rounded-xl',
                  },
                }}
              />
            )}
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
};

export default Auth;
