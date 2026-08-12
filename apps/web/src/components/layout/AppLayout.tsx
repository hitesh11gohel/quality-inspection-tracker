import LogInspectionDialog from "@/components/inspections/LogInspectionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogDialogContext } from "@/lib/LogDialogContext";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutAction } from "@/store/slices/authSlice";
import { ClipboardList, LayoutDashboard, LogOut, Plus, Scissors, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

// ── Avatar helpers ─────────────────────────────────────────────────────────────

function initials(username: string): string {
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

// ── Menu item style ────────────────────────────────────────────────────────────

const ITEM =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent";

// ── Layout ─────────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openLogDialog = () => {
    setMenuOpen(false);
    setLogDialogOpen(true);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const userInitials = user ? initials(user.username) : "?";

  return (
    <LogDialogContext.Provider value={openLogDialog}>
      <div className="flex h-screen flex-col bg-background">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Scissors className="h-3.5 w-3.5" />
            </div>
            <span className="text-lg font-bold text-primary">QualyTrack</span>
          </Link>

          {/* ── Avatar trigger + dropdown ──────────────────────────────── */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Open account menu"
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                "rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                menuOpen && "ring-2 ring-ring ring-offset-2"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* ── Dropdown panel ────────────────────────────────────────── */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-background shadow-lg">
                {/* User info */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user?.username}
                    </p>
                    <p className="truncate text-xs capitalize text-muted-foreground">
                      {user?.role}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Nav items */}
                <div className="p-2 space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      ITEM,
                      isActive("/profile") ? "text-primary" : "text-foreground"
                    )}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    Profile
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      to="/admin/users"
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        ITEM,
                        isActive("/admin/users") ? "text-primary" : "text-foreground"
                      )}
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      Manage Users
                    </Link>
                  )}
                </div>

                <Separator />

                {/* Sign out */}
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      dispatch(logoutAction());
                    }}
                    className={cn(
                      ITEM,
                      "text-destructive hover:text-destructive"
                    )}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Page content ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto pb-16 sm:pb-0">
          <Outlet />
        </main>

        {/* ── Bottom nav (mobile only) ────────────────────────────────────── */}
        <nav className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-stretch border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden">
          <Link
            to="/dashboard"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              isActive("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>

          <button
            type="button"
            onClick={openLogDialog}
            aria-label="Log new inspection"
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Plus className="h-5 w-5" />
            </span>
            Log
          </button>

          <Link
            to="/inspections"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              isActive("/inspections") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardList className="h-5 w-5" />
            Inspections
          </Link>
        </nav>

        <LogInspectionDialog
          open={logDialogOpen}
          onOpenChange={setLogDialogOpen}
        />
      </div>
    </LogDialogContext.Provider>
  );
}
