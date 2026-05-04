import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <PageLayout>
      <section className="py-24 sm:py-32">
        <div className="max-w-lg mx-auto px-6 text-center">
          <p className="text-7xl font-heading font-bold text-primary mb-4">404</p>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
            Page not found
          </h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default NotFound;
