import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Brain, BookOpen, LayoutDashboard, Users, AlertTriangle, Zap, Globe, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex items-center gap-2.5 p-4 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold">Think Studio</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
