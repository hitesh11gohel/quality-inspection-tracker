import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchInspections } from "@/store/slices/inspectionsSlice";
import { fetchSummary } from "@/store/slices/summarySlice";
import type { Severity, Status } from "@qit/shared";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function safePct(n: number, d: number): number {
  return d ? Math.round((n / d) * 100) : 0;
}

// ── Look-up tables ────────────────────────────────────────────────────────────

const SEVERITIES: Severity[] = ["Critical", "Major", "Minor"];

const SEV_DOT: Record<Severity, string> = {
  Critical: "bg-red-500",
  Major: "bg-amber-500",
  Minor: "bg-green-500",
};
const SEV_BAR: Record<Severity, string> = {
  Critical: "bg-red-500",
  Major: "bg-amber-500",
  Minor: "bg-green-500",
};
const SEV_TEXT: Record<Severity, string> = {
  Critical: "text-red-600",
  Major: "text-amber-600",
  Minor: "text-green-600",
};
const SEV_BADGE: Record<Severity, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  Major: "bg-amber-50 text-amber-700 border-amber-200",
  Minor: "bg-green-50 text-green-700 border-green-200",
};
const STATUS_BADGE: Record<Status, string> = {
  Open: "bg-orange-50 text-orange-700 border-orange-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ── Compact KPI card ──────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  topBorder: string;
  iconBg: string;
  iconFg: string;
  valueFg: string;
  loading: boolean;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  topBorder,
  iconBg,
  iconFg,
  valueFg,
  loading,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-t-4 bg-card px-4 py-3.5 shadow-sm",
        topBorder
      )}
    >
      {/* Label + icon */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={cn("rounded-md p-1 shrink-0", iconBg)}>
          <Icon className={cn("h-3.5 w-3.5", iconFg)} />
        </span>
      </div>

      {/* Value + sub on the same row */}
      <div className="mt-2 flex items-end justify-between gap-2">
        {loading ? (
          <Skeleton className="h-7 w-12 rounded" />
        ) : (
          <p
            className={cn(
              "text-3xl font-extrabold leading-none tracking-tight",
              valueFg
            )}
          >
            {value}
          </p>
        )}
        {!loading && (
          <p className="mb-0.5 text-[11px] leading-tight text-muted-foreground text-right">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { stats, isLoading: summaryLoading } = useAppSelector((s) => s.summary);
  const { items: recentItems, isLoading: listLoading } = useAppSelector(
    (s) => s.inspections
  );

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(
      fetchInspections({ limit: 5, sortBy: "createdAt", sortOrder: "desc" })
    );

    const interval = setInterval(() => dispatch(fetchSummary()), 60_000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!summaryLoading && stats === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <p className="font-semibold text-foreground">No inspections yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Log your first one to see stats here.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/log">
            <PlusCircle className="mr-2 h-4 w-4" />
            Log Inspection
          </Link>
        </Button>
      </div>
    );
  }

  const total = stats?.total ?? 0;
  const open = stats?.open ?? 0;
  const resolved = stats?.resolved ?? 0;
  const resolutionRate = safePct(resolved, total);
  const criticalOpen = stats?.bySeverity.Critical.open ?? 0;

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-10 lg:py-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            {getGreeting()}, {user?.username ?? ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Quality Inspection Dashboard
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFullDate(new Date())}
          </p>
        </div>
        <Button asChild size="sm" className="hidden shrink-0 sm:flex">
          <Link to="/log">
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Log Inspection
          </Link>
        </Button>
      </div>

      {/* ── Critical alert — full-width, above KPI cards ─────────────────── */}
      {!summaryLoading && criticalOpen > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <p className="flex-1 text-sm font-medium text-red-900">
            {criticalOpen} critical {criticalOpen === 1 ? "issue" : "issues"}{" "}
            still open — requires immediate attention.
          </p>
          <Link
            to="/inspections"
            className="shrink-0 text-xs font-semibold text-red-700 hover:underline"
          >
            Review →
          </Link>
        </div>
      )}

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Total"
          value={total}
          sub="all inspections"
          icon={ClipboardList}
          topBorder="border-t-slate-400"
          iconBg="bg-slate-100"
          iconFg="text-slate-600"
          valueFg="text-foreground"
          loading={summaryLoading}
        />
        <KpiCard
          label="Open"
          value={open}
          sub={total ? `${safePct(open, total)}% of total` : "—"}
          icon={AlertCircle}
          topBorder="border-t-amber-500"
          iconBg="bg-amber-100"
          iconFg="text-amber-600"
          valueFg="text-amber-600"
          loading={summaryLoading}
        />
        <KpiCard
          label="Resolved"
          value={resolved}
          sub={total ? `${safePct(resolved, total)}% of total` : "—"}
          icon={CheckCircle2}
          topBorder="border-t-green-500"
          iconBg="bg-green-100"
          iconFg="text-green-600"
          valueFg="text-green-600"
          loading={summaryLoading}
        />
        <KpiCard
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          sub={resolved ? `${resolved} of ${total} closed` : "none closed yet"}
          icon={TrendingUp}
          topBorder="border-t-blue-500"
          iconBg="bg-blue-100"
          iconFg="text-blue-600"
          valueFg="text-blue-600"
          loading={summaryLoading}
        />
      </div>

      {/* ── Main: 50 / 50 split ───────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* ── Recent Inspections ────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Inspections
            </h2>
            <Link
              to="/inspections"
              className="flex items-center gap-0.5 text-xs text-primary hover:underline"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {listLoading ? (
            <div className="divide-y">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                  <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                  <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                  <Skeleton className="h-3 w-8 shrink-0 rounded" />
                </div>
              ))}
            </div>
          ) : recentItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No inspections logged yet.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentItems.map((inspection) => (
                <Link
                  key={inspection.id}
                  to={`/inspections/${inspection.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {inspection.machineLineId}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {inspection.defectType}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "hidden shrink-0 text-xs sm:inline-flex",
                      SEV_BADGE[inspection.severity]
                    )}
                  >
                    {inspection.severity}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-xs",
                      STATUS_BADGE[inspection.status]
                    )}
                  >
                    {inspection.status}
                  </Badge>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {shortDate(inspection.date)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── By Severity ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold text-foreground">
            By Severity
          </h2>

          <div className="space-y-5">
            {summaryLoading
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-4 w-10 rounded" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-3 w-10 rounded" />
                    </div>
                  </div>
                ))
              : SEVERITIES.map((sev) => {
                  const row = stats?.bySeverity[sev];
                  const rate = safePct(row?.resolved ?? 0, row?.total ?? 0);
                  return (
                    <div key={sev}>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "flex items-center gap-2 text-sm font-semibold",
                            SEV_TEXT[sev]
                          )}
                        >
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              SEV_DOT[sev]
                            )}
                          />
                          {sev}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-foreground">
                          {rate}% resolved
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            SEV_BAR[sev]
                          )}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>
                          {row?.open ?? 0} open · {row?.resolved ?? 0} resolved
                        </span>
                        <span>{row?.total ?? 0} total</span>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Overall resolution bar */}
          {!summaryLoading && stats && (
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Overall resolution
                </span>
                <span className="font-semibold text-foreground">
                  {resolutionRate}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
