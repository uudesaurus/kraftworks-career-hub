import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, Menu, X, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/kraftworks-logo.png';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const [toolkitOpen, setToolkitOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolkitOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setToolkitOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const isToolkitActive = location.pathname.startsWith('/career-toolkit');

  const navLinkClass = (path: string) =>
    `${isActive(path) ? 'text-primary font-semibold' : ''}`;

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Kraftworks" className="h-8 w-auto shrink-0 object-contain" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Career Toolkit Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setToolkitOpen(!toolkitOpen)}
              className={`gap-1 ${isToolkitActive ? 'text-primary font-semibold' : ''}`}
            >
              Career Toolkit
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${toolkitOpen ? 'rotate-180' : ''}`} />
            </Button>
            <AnimatePresence>
              {toolkitOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 w-52 rounded-lg border border-border bg-card shadow-lg py-1 z-50"
                >
                  <Link to="/career-toolkit" className="block px-4 py-2 text-sm hover:bg-accent transition-colors">
                    All Resources
                  </Link>
                  <Link to="/career-toolkit/hvac" className="block px-4 py-2 text-sm hover:bg-accent transition-colors">
                    HVAC & Refrigeration
                  </Link>
                  <Link to="/career-toolkit/electrical" className="block px-4 py-2 text-sm hover:bg-accent transition-colors">
                    Electrical Technology
                  </Link>
                  <Link to="/career-toolkit/welding" className="block px-4 py-2 text-sm hover:bg-accent transition-colors">
                    Welding Technology
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/resume-review">
            <Button variant="ghost" size="sm" className={navLinkClass('/resume-review')}>Resume Review</Button>
          </Link>
          <Link to="/interview-prep">
            <Button variant="ghost" size="sm" className={navLinkClass('/interview-prep')}>Interview Prep</Button>
          </Link>
          <Link to="/career-fair">
            <Button variant="ghost" size="sm" className={navLinkClass('/career-fair')}>Career Fair</Button>
          </Link>
          <Link to="/blog">
            <Button variant="ghost" size="sm" className={navLinkClass('/blog')}>Blog</Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/settings">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-3.5 w-3.5" />
                    {user.user_metadata?.full_name || 'Dashboard'}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">
                    Get Started
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border"
          >
            <div className="px-4 sm:px-6 py-4 space-y-1">
              <div className="py-2">
                <button className="flex items-center gap-1 text-sm font-medium w-full" onClick={() => setToolkitOpen(!toolkitOpen)}>
                  Career Toolkit
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${toolkitOpen ? 'rotate-180' : ''}`} />
                </button>
                {toolkitOpen && (
                  <div className="pl-4 mt-1 space-y-1">
                    <Link to="/career-toolkit" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground">All Resources</Link>
                    <Link to="/career-toolkit/hvac" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground">HVAC & Refrigeration</Link>
                    <Link to="/career-toolkit/electrical" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground">Electrical Technology</Link>
                    <Link to="/career-toolkit/welding" className="block py-1.5 text-sm text-muted-foreground hover:text-foreground">Welding Technology</Link>
                  </div>
                )}
              </div>
              <Link to="/resume-review" className="block py-2 text-sm font-medium">Resume Review</Link>
              <Link to="/interview-prep" className="block py-2 text-sm font-medium">Interview Prep</Link>
              <Link to="/career-fair" className="block py-2 text-sm font-medium">Career Fair</Link>
              <Link to="/blog" className="block py-2 text-sm font-medium">Blog</Link>
              <div className="pt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <User className="h-3.5 w-3.5" />
                        {user.user_metadata?.full_name || 'Dashboard'}
                      </Button>
                    </Link>
                    <Button size="sm" className="w-full" onClick={signOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth">
                      <Button size="sm" className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
