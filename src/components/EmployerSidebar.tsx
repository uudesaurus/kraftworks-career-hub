import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import logo from '@/assets/kraftworks-logo.png';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { employerApi } from '@/lib/api';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || 'https://career.kraftworks.app';

export function EmployerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<{ pending_applications?: number; active_jobs?: number }>({});

  useEffect(() => {
    employerApi.getDashboard().then(d => {
      setStats(d?.stats || {});
    }).catch(() => {});
  }, []);

  const navItems = [
    { title: 'Dashboard', url: '/employer', icon: LayoutDashboard, badge: null },
    { title: 'Company Profile', url: '/employer/company', icon: Building2, badge: null },
    { title: 'Job Listings', url: '/employer/jobs', icon: Briefcase, badge: stats.active_jobs || null },
    { title: 'Applications', url: '/employer/applications', icon: Users, badge: stats.pending_applications || null },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          {collapsed ? (
            <img src="/favicon.svg" alt="Kraftworks" className="h-8 w-8 rounded-lg shrink-0 object-cover" />
          ) : (
            <img src={logo} alt="Kraftworks" className="h-7 w-auto shrink-0 object-contain" />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              Employer Portal
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Beta</Badge>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.badge !== null && (
                            <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Help section */}
        {!collapsed && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={`${MAIN_APP_URL}/career-fair`} target="_blank" rel="noopener noreferrer" className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>View Career Fair</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-2 space-y-0.5">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.user_metadata?.full_name || 'Employer'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user.email}
            </p>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center mb-2">
            <div className="h-7 w-7 rounded-full bg-sidebar-primary/10 flex items-center justify-center text-xs font-medium text-sidebar-primary">
              {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'E'}
            </div>
          </div>
        )}
        <SidebarMenuButton
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
