import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, BookOpen, LayoutDashboard, Users, AlertTriangle, Zap, Globe, Shield, User, LogOut, LogIn, GraduationCap, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { MobileNav } from './MobileNav';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', label: 'Home', icon: Brain },
  { to: '/cases', label: 'Cases', icon: BookOpen },
  { to: '/simulations', label: 'Simulations', icon: Zap },
  { to: '/detective', label: 'Detective', icon: AlertTriangle },
  { to: '/community', label: 'Community', icon: Globe },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/mentor-match', label: 'Mentors', icon: GraduationCap },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, profile, role, isAdmin, signOut, isLoading } = useAuthContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b"
            : "bg-transparent"
        )}
      >
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
              >
                <Brain className="h-5 w-5" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Think Studio
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Clinical Reasoning Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-primary/10 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={cn("h-4 w-4 transition-colors", isActive && "text-primary")} />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {isLoading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-primary/10">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                        {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <div className="px-3 py-3 bg-muted/50 rounded-lg mb-2">
                    <p className="text-sm font-semibold">{profile?.display_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={role === 'admin' ? 'default' : role === 'expert' ? 'secondary' : 'outline'}
                        className="text-xs capitalize"
                      >
                        {role}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="rounded-lg cursor-pointer">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t bg-background/95 backdrop-blur-xl"
            >
              <nav className="container py-4 flex flex-col gap-1">
                {navItems.map((item, idx) => {
                  const isActive = location.pathname === item.to;
                  const Icon = item.icon;

                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                        {isActive && <motion.div layoutId="mobileActive" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      {/* Spacer to prevent fixed header from overlapping page content */}
      <div className="h-16" />
    </>
  );
}
