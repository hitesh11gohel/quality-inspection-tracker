import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Inspection, InspectionFilters, Severity, Status, User } from '@qit/shared';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchInspections, setFilters } from '@/store/slices/inspectionsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Style helpers ─────────────────────────────────────────────────────────────

const severityPill: Record<Severity | 'All', { selected: string; idle: string }> = {
  All:      { selected: 'bg-foreground text-background',      idle: 'bg-muted text-foreground hover:bg-muted/80' },
  Critical: { selected: 'bg-red-500 text-white',              idle: 'bg-red-100 text-red-700 hover:bg-red-200' },
  Major:    { selected: 'bg-amber-500 text-white',            idle: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  Minor:    { selected: 'bg-green-500 text-white',            idle: 'bg-green-100 text-green-700 hover:bg-green-200' },
};

const statusPill: Record<Status | 'All', { selected: string; idle: string }> = {
  All:      { selected: 'bg-foreground text-background',      idle: 'bg-muted text-foreground hover:bg-muted/80' },
  Open:     { selected: 'bg-blue-500 text-white',             idle: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  Resolved: { selected: 'bg-green-500 text-white',            idle: 'bg-green-100 text-green-700 hover:bg-green-200' },
};

const severityBadge: Record<Severity, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  Major:    'bg-amber-100 text-amber-700 border border-amber-200',
  Minor:    'bg-green-100 text-green-700 border border-green-200',
};

const statusBadge: Record<Status, string> = {
  Open:     'border border-blue-400 text-blue-600',
  Resolved: 'bg-green-500 text-white',
};

// ── Pill button ───────────────────────────────────────────────────────────────

function Pill({
  label,
  selected,
  styles,
  onClick,
}: {
  label: string;
  selected: boolean;
  styles: { selected: string; idle: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
        selected ? styles.selected : styles.idle
      )}
    >
      {label}
    </button>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Inspection card ───────────────────────────────────────────────────────────

function InspectionCard({
  inspection,
  currentUser,
  onClick,
}: {
  inspection: Inspection;
  currentUser: User | null;
  onClick: () => void;
}) {
  const dateLabel = format(parseISO(inspection.date), 'd MMM yyyy');
  const isOwner   = !!currentUser && inspection.createdBy === currentUser.id;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="pt-4">
        {/* Row 1: Machine ID + Severity */}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 truncate font-semibold text-foreground">
            {inspection.machineLineId}
            {isOwner && (
              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                you
              </span>
            )}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              severityBadge[inspection.severity]
            )}
          >
            {inspection.severity}
          </span>
        </div>

        {/* Row 2: Defect type + Date */}
        <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{inspection.defectType}</span>
          <span className="shrink-0">·</span>
          <span className="shrink-0">{dateLabel}</span>
        </div>

        {/* Row 3: Status + hint */}
        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
              statusBadge[inspection.status]
            )}
          >
            {inspection.status}
          </span>
          <span className="text-xs text-muted-foreground">Tap to view →</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { label: 'Date ↓',   value: 'date-desc' },
  { label: 'Date ↑',   value: 'date-asc' },
  { label: 'Severity', value: 'severity-desc' },
  { label: 'Created',  value: 'createdAt-desc' },
] as const;

export default function InspectionsPage() {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();

  const currentUser = useAppSelector((s) => s.auth.user);
  const filters     = useAppSelector((s) => s.inspections.filters);
  const items       = useAppSelector((s) => s.inspections.items);
  const total       = useAppSelector((s) => s.inspections.total);
  const isLoading   = useAppSelector((s) => s.inspections.isLoading);

  const [filterOpen, setFilterOpen]     = useState(false);
  const [displayItems, setDisplayItems] = useState<Inspection[]>([]);
  const [localPage, setLocalPage]       = useState(1);
  const isLoadMoreRef                   = useRef(false);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchInspections(filters));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync displayItems when Redux items change
  useEffect(() => {
    if (isLoadMoreRef.current) {
      setDisplayItems((prev) => [...prev, ...items]);
      isLoadMoreRef.current = false;
    } else {
      setDisplayItems(items);
    }
  }, [items]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const applyFilter = (updates: Partial<InspectionFilters>) => {
    const merged = { ...filters, ...updates, page: 1 };
    setLocalPage(1);
    isLoadMoreRef.current = false;
    dispatch(setFilters(updates));
    dispatch(fetchInspections(merged));
  };

  const handleLoadMore = () => {
    const nextPage = localPage + 1;
    setLocalPage(nextPage);
    isLoadMoreRef.current = true;
    dispatch(fetchInspections({ ...filters, page: nextPage }));
  };

  const clearFilters = () => {
    const cleared: InspectionFilters = { page: 1 };
    setLocalPage(1);
    isLoadMoreRef.current = false;
    dispatch(setFilters({ severity: undefined, status: undefined, dateFrom: undefined, dateTo: undefined, sortBy: undefined, sortOrder: undefined }));
    dispatch(fetchInspections(cleared));
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const hasActiveFilters = !!(
    filters.severity || filters.status || filters.dateFrom || filters.dateTo ||
    (filters.sortBy && !(filters.sortBy === 'date' && filters.sortOrder === 'desc'))
  );

  const sortValue = filters.sortBy
    ? `${filters.sortBy}-${filters.sortOrder ?? 'desc'}`
    : 'date-desc';

  const hasMore = displayItems.length < total;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-4">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Inspections</h1>
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Filter className="h-4 w-4" />
          Filters
          {filterOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              !
            </span>
          )}
        </button>
      </div>

      {/* Filter bar */}
      {filterOpen && (
        <div className="mb-4 space-y-4 rounded-lg border bg-card p-4 shadow-sm">

          {/* Severity pills */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Severity
            </p>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Critical', 'Major', 'Minor'] as const).map((s) => (
                <Pill
                  key={s}
                  label={s}
                  selected={s === 'All' ? !filters.severity : filters.severity === s}
                  styles={severityPill[s]}
                  onClick={() => applyFilter({ severity: s === 'All' ? undefined : s })}
                />
              ))}
            </div>
          </div>

          {/* Status pills */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Open', 'Resolved'] as const).map((s) => (
                <Pill
                  key={s}
                  label={s}
                  selected={s === 'All' ? !filters.status : filters.status === s}
                  styles={statusPill[s]}
                  onClick={() => applyFilter({ status: s === 'All' ? undefined : s })}
                />
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date Range
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={filters.dateFrom ?? ''}
                  onChange={(e) => applyFilter({ dateFrom: e.target.value || undefined })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={filters.dateTo ?? ''}
                  onChange={(e) => applyFilter({ dateTo: e.target.value || undefined })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sort by */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sort By
            </p>
            <Select
              value={sortValue}
              onValueChange={(v) => {
                const [by, order] = v.split('-') as [
                  InspectionFilters['sortBy'],
                  InspectionFilters['sortOrder']
                ];
                applyFilter({ sortBy: by, sortOrder: order });
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="flex w-full items-center gap-1.5"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Count */}
      {!isLoading && displayItems.length > 0 && (
        <p className="mb-3 text-sm text-muted-foreground">
          Showing {displayItems.length} of {total} inspection{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Loading state */}
      {isLoading && displayItems.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-base font-semibold text-foreground">No inspections found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Try adjusting your filters.'
              : 'Start tracking quality defects by logging your first inspection.'}
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={() => navigate('/log')}>
              Log your first inspection
            </Button>
          )}
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Inspection list */}
      {displayItems.length > 0 && (
        <div className="space-y-3">
          {displayItems.map((inspection) => (
            <InspectionCard
              key={inspection.id}
              inspection={inspection}
              currentUser={currentUser}
              onClick={() => navigate(`/inspections/${inspection.id}`)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !isLoading && displayItems.length > 0 && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={handleLoadMore}
        >
          Load more
        </Button>
      )}

      {/* Loading more indicator */}
      {isLoading && displayItems.length > 0 && (
        <div className="mt-4 space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
    </div>
  );
}
