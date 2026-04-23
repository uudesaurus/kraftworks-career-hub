import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { FeedbackGenerationBanner } from '@/components/FeedbackProgressOverlay';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const isResumeReviewPage = location.pathname === '/resume-review';
  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Show generation banner on pages other than resume-review */}
          {!isResumeReviewPage && <FeedbackGenerationBanner />}
          <header className="h-14 flex items-center justify-between border-b border-border px-4">
            <SidebarTrigger />
            {user && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-normal hidden sm:inline-flex">
                  Beta
                </Badge>
                <div className="flex items-center gap-2 text-sm">
                  <Link to="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {initials || <User className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-foreground font-medium hidden sm:inline">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
