import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, ClipboardList, User, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutAction } from '@/store/slices/authSlice';

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard'   },
  { label: 'Log',        icon: PlusCircle,       path: '/log'         },
  { label: 'Inspections', icon: ClipboardList,   path: '/inspections' },
  { label: 'Profile',    icon: User,             path: '/profile'     },
] as const;

export default function AppLayout() {
  const location = useLocation();
  const dispatch  = useAppDispatch();
  const user      = useAppSelector((s) => s.auth.user);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">QIT</span>
          <span className="hidden text-sm text-muted-foreground sm:block">
            Quality Inspection Tracker
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden text-sm font-medium sm:block">{user.username}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={() => dispatch(logoutAction())}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────────── */}
      {/* pb-16 leaves room for the fixed bottom nav (h-16) */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* ── Bottom navigation ────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 shrink-0 items-stretch border-t bg-background">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive(path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
