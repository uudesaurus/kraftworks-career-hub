import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Briefcase,
  Users,
  LogOut,
  Shield,
  Settings,
} from 'lucide-react';
import logo from '@/assets/kraftworks-logo.png';
import { NavLink } from '@/components/NavLink';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Badge } from '@/components/ui/badge';
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

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Resume Review', url: '/resume-review', icon: FileText },
  { title: 'Interview Prep', url: '/interview-prep', icon: MessageSquare },
  { title: 'Career Toolkit', url: '/career-toolkit', icon: Briefcase },
  { title: 'Career Fair', url: '/career-fair', icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <Link to="/dashboard" aria-label="Go to dashboard home">
            {collapsed ? (
              <img src="/favicon.svg" alt="Kraftworks" className="h-8 w-8 rounded-lg shrink-0 object-cover" />
            ) : (
              <img src={logo} alt="Kraftworks" className="h-7 w-auto shrink-0 object-contain" />
            )}
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin')}>
                    <NavLink
                      to="/admin"
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && user && (
          <div className="mb-2 space-y-0.5">
            <NavLink to="/settings" className="hover:text-primary transition-colors">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.user_metadata?.full_name || 'User'}
              </p>
            </NavLink>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user.email}
            </p>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center mb-2">
            <NavLink to="/settings">
              <div className="h-7 w-7 rounded-full bg-sidebar-primary/10 flex items-center justify-center text-xs font-medium text-sidebar-primary hover:bg-sidebar-primary/20 transition-colors">
                {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </NavLink>
          </div>
        )}
        <SidebarMenuButton
          asChild
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <NavLink to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </SidebarMenuButton>
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
