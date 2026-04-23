import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { EmployerSidebar } from '@/components/EmployerSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';

interface EmployerLayoutProps {
  children: ReactNode;
}

export function EmployerLayout({ children }: EmployerLayoutProps) {
  const { user } = useAuth();
  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <EmployerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border bg-background px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Employer Portal</span>
            </div>
            {user && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {initials || '?'}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium leading-none">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  {user.user_metadata?.full_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  )}
                </div>
              </div>
            )}
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
