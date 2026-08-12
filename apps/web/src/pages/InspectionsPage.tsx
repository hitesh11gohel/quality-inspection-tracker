import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DATE_PRESETS,
  type DatePreset,
  SEV_DOT,
  SEVERITY_BADGE,
  SORT_OPTIONS,
  type SortValue,
  STATUS_BADGE,
  STATUS_DOT,
} from "@/constants/inspections";
import { useOpenLogDialog } from "@/lib/LogDialogContext";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchInspections, setFilters } from "@/store/slices/inspectionsSlice";
import type {
  Inspection,
  InspectionFilters,
  Severity,
  Status,
  User,
} from "@qit/shared";
import { format, parseISO, subDays } from "date-fns";
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PlusCircle,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────

// ── Filter pill component ─────────────────────────────────────────────────────

function FilterPill({
  label,
  icon: Icon,
  isOpen,
  hasValue,
  onClick,
  onClear,
  children,
  align = "left",
}: {
  label: string;
  icon?: React.ElementType;
  isOpen: boolean;
  hasValue: boolean;
  onClick: () => void;
  onClear?: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className="relative shrink-0 flex items-center">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 h-9 px-3 border bg-background text-sm font-medium",
          "transition-colors whitespace-nowrap",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          hasValue && onClear
            ? "rounded-l-lg rounded-r-none border-r-0"
            : "rounded-lg",
          hasValue || isOpen
            ? "border-primary text-primary bg-primary/5"
            : "border-border text-foreground hover:bg-accent"
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {hasValue && onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className={cn(
            "flex items-center justify-center h-9 w-7 rounded-r-lg border border-l-0",
            "transition-colors border-primary bg-primary/5 text-primary hover:bg-primary/15",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          )}
          aria-label="Clear filter"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            "absolute top-full z-30 mt-1 rounded-lg border bg-background shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Dropdown option row ───────────────────────────────────────────────────────

function DropdownOption({
  label,
  selected,
  dot,
  onClick,
}: {
  label: string;
  selected: boolean;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent",
        selected && "bg-primary/10"
      )}
    >
      {dot !== undefined ? (
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            dot || "bg-muted-foreground"
          )}
        />
      ) : (
        <span className="h-2 w-2 shrink-0" />
      )}
      <span
        className={cn(
          "flex-1 text-left",
          selected && "font-semibold text-primary"
        )}
      >
        {label}
      </span>
      {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
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
  const dateLabel = format(parseISO(inspection.date), "d MMM yyyy");
  const isOwner = !!currentUser && inspection.createdBy === currentUser.id;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="pt-4">
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
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              SEVERITY_BADGE[inspection.severity]
            )}
          >
            {inspection.severity}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{inspection.defectType}</span>
          <span className="shrink-0">·</span>
          <span className="shrink-0">{dateLabel}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              STATUS_BADGE[inspection.status]
            )}
          >
            {inspection.status}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            Tap to view <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ActiveFilter = "severity" | "status" | "dateRange" | "sort" | null;

export default function InspectionsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const openLogDialog = useOpenLogDialog();

  const currentUser = useAppSelector((s) => s.auth.user);
  const filters = useAppSelector((s) => s.inspections.filters);
  const items = useAppSelector((s) => s.inspections.items);
  const total = useAppSelector((s) => s.inspections.total);
  const isLoading = useAppSelector((s) => s.inspections.isLoading);

  const [displayItems, setDisplayItems] = useState<Inspection[]>([]);
  const [localPage, setLocalPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [draftFrom, setDraftFrom] = useState(filters.dateFrom ?? "");
  const [draftTo, setDraftTo] = useState(filters.dateTo ?? "");
  const [dateError, setDateError] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("");

  const isLoadMoreRef = useRef(false);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = displayItems.length < total;

  // Initial fetch
  useEffect(() => {
    dispatch(fetchInspections(filters));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync display items on Redux change
  useEffect(() => {
    if (isLoadMoreRef.current) {
      setDisplayItems((prev) => [...prev, ...items]);
      isLoadMoreRef.current = false;
    } else {
      setDisplayItems(items);
    }
  }, [items]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        filterBarRef.current &&
        !filterBarRef.current.contains(e.target as Node)
      ) {
        setActiveFilter(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const term = searchInput.trim() || undefined;
      if (term !== filters.search) {
        applyFilter({ search: term });
      }
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadMoreRef.current) {
          handleLoadMore();
        }
      },
      { rootMargin: "0px 0px 300px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setSearchInput("");
    setDraftFrom("");
    setDraftTo("");
    setDateError("");
    setDatePreset("");
    setLocalPage(1);
    isLoadMoreRef.current = false;
    dispatch(
      setFilters({
        search: undefined,
        severity: undefined,
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
    );
    dispatch(fetchInspections({ page: 1 }));
  };

  const toggle = (f: ActiveFilter) => {
    setActiveFilter((prev) => {
      if (prev !== f && f === "dateRange") {
        if (datePreset === "custom") {
          setDraftFrom(filters.dateFrom ?? "");
          setDraftTo(filters.dateTo ?? "");
        }
        setDateError("");
      }
      return prev === f ? null : f;
    });
  };

  const applyPreset = (preset: { value: DatePreset; days?: number }) => {
    if (preset.value === "custom") {
      setDatePreset("custom");
      setDraftFrom(filters.dateFrom ?? "");
      setDraftTo(filters.dateTo ?? "");
      setDateError("");
      return;
    }
    const today = new Date();
    const from = format(subDays(today, preset.days! - 1), "yyyy-MM-dd");
    const to = format(today, "yyyy-MM-dd");
    setDatePreset(preset.value);
    setDraftFrom("");
    setDraftTo("");
    applyFilter({ dateFrom: from, dateTo: to });
    setActiveFilter(null);
  };

  const applyDateRange = () => {
    if (!draftFrom || !draftTo) {
      setDateError("Both From and To dates are required.");
      return;
    }
    if (draftTo < draftFrom) {
      setDateError("To date must be after From date.");
      return;
    }
    setDateError("");
    setDatePreset("custom");
    applyFilter({ dateFrom: draftFrom, dateTo: draftTo });
    setActiveFilter(null);
  };

  const clearDateRange = () => {
    setDraftFrom("");
    setDraftTo("");
    setDateError("");
    setDatePreset("");
    applyFilter({ dateFrom: undefined, dateTo: undefined });
    setActiveFilter(null);
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  // search has its own inline X — only count pill filters toward the threshold
  const activeFilterCount = [
    !!filters.severity,
    !!filters.status,
    !!(filters.dateFrom || filters.dateTo),
    !!filters.sortBy,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || !!filters.search;

  // true during initial load AND filter changes (not during infinite scroll load-more)
  const isFilterLoading = isLoading && !isLoadMoreRef.current;

  const currentSort: SortValue = filters.sortBy
    ? (`${filters.sortBy}-${filters.sortOrder ?? "desc"}` as SortValue)
    : "createdAt-desc";

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Sort";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-4">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="mb-2 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Inspections</h1>
        <Button size="sm" className="hidden sm:flex" onClick={openLogDialog}>
          <PlusCircle className="mr-1.5 h-4 w-4" />
          Log Inspection
        </Button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div ref={filterBarRef} className="mb-4 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by machine, defect type, remarks…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter pills row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity */}
          <FilterPill
            label={filters.severity ?? "Severity"}
            isOpen={activeFilter === "severity"}
            hasValue={!!filters.severity}
            onClick={() => toggle("severity")}
            onClear={() => {
              applyFilter({ severity: undefined });
              setActiveFilter(null);
            }}
          >
            <div className="min-w-[140px] py-1">
              <DropdownOption
                label="All"
                selected={!filters.severity}
                onClick={() => {
                  applyFilter({ severity: undefined });
                  setActiveFilter(null);
                }}
              />
              {(["Critical", "Major", "Minor"] as Severity[]).map((sev) => (
                <DropdownOption
                  key={sev}
                  label={sev}
                  selected={filters.severity === sev}
                  dot={SEV_DOT[sev]}
                  onClick={() => {
                    applyFilter({ severity: sev });
                    setActiveFilter(null);
                  }}
                />
              ))}
            </div>
          </FilterPill>

          {/* Status */}
          <FilterPill
            label={filters.status ?? "Status"}
            isOpen={activeFilter === "status"}
            hasValue={!!filters.status}
            onClick={() => toggle("status")}
            onClear={() => {
              applyFilter({ status: undefined });
              setActiveFilter(null);
            }}
          >
            <div className="min-w-[140px] py-1">
              <DropdownOption
                label="All"
                selected={!filters.status}
                onClick={() => {
                  applyFilter({ status: undefined });
                  setActiveFilter(null);
                }}
              />
              {(["Open", "Resolved"] as Status[]).map((st) => (
                <DropdownOption
                  key={st}
                  label={st}
                  selected={filters.status === st}
                  dot={STATUS_DOT[st]}
                  onClick={() => {
                    applyFilter({ status: st });
                    setActiveFilter(null);
                  }}
                />
              ))}
            </div>
          </FilterPill>

          {/* Date Range */}
          <FilterPill
            label="Date Range"
            icon={Calendar}
            isOpen={activeFilter === "dateRange"}
            hasValue={!!(filters.dateFrom || filters.dateTo)}
            onClick={() => toggle("dateRange")}
            onClear={clearDateRange}
            align="right"
          >
            <div className="w-52 py-1">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent",
                    datePreset === p.value && "bg-primary/10 text-primary"
                  )}
                >
                  {p.label}
                  {datePreset === p.value && (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              ))}

              {datePreset === "custom" && (
                <>
                  <div className="mx-3 my-1 border-t" />
                  <div className="px-3 pb-3 pt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="w-8 shrink-0 text-xs font-medium text-muted-foreground">
                        From
                      </label>
                      <div className="relative flex-1 min-w-0">
                        <Input
                          ref={fromDateRef}
                          type="date"
                          value={draftFrom}
                          onChange={(e) => {
                            setDraftFrom(e.target.value);
                            setDateError("");
                          }}
                          className="h-8 w-full pr-8 text-sm [&::-webkit-calendar-picker-indicator]:hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              fromDateRef.current?.showPicker();
                            } catch {
                              fromDateRef.current?.click();
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-8 shrink-0 text-xs font-medium text-muted-foreground">
                        To
                      </label>
                      <div className="relative flex-1 min-w-0">
                        <Input
                          ref={toDateRef}
                          type="date"
                          value={draftTo}
                          min={draftFrom || undefined}
                          onChange={(e) => {
                            setDraftTo(e.target.value);
                            setDateError("");
                          }}
                          className="h-8 w-full pr-8 text-sm [&::-webkit-calendar-picker-indicator]:hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              toDateRef.current?.showPicker();
                            } catch {
                              toDateRef.current?.click();
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {dateError && (
                      <p className="text-xs text-destructive">{dateError}</p>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={clearDateRange}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={applyDateRange}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {datePreset !== "" && datePreset !== "custom" && (
                <>
                  <div className="mx-3 my-1 border-t" />
                  <div className="px-3 py-1.5">
                    <button
                      type="button"
                      onClick={clearDateRange}
                      className="w-full py-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Clear date filter
                    </button>
                  </div>
                </>
              )}
            </div>
          </FilterPill>

          {/* Sort */}
          <FilterPill
            label={filters.sortBy ? sortLabel : "Sort"}
            icon={ArrowUpDown}
            isOpen={activeFilter === "sort"}
            hasValue={!!filters.sortBy}
            onClick={() => toggle("sort")}
            onClear={() => {
              applyFilter({ sortBy: undefined, sortOrder: undefined });
              setActiveFilter(null);
            }}
          >
            <div className="min-w-[160px] py-1">
              {SORT_OPTIONS.map((opt) => (
                <DropdownOption
                  key={opt.value}
                  label={opt.label}
                  selected={currentSort === opt.value && !!filters.sortBy}
                  onClick={() => {
                    const [by, order] = opt.value.split("-") as [
                      InspectionFilters["sortBy"],
                      InspectionFilters["sortOrder"],
                    ];
                    applyFilter({ sortBy: by, sortOrder: order });
                    setActiveFilter(null);
                  }}
                />
              ))}
            </div>
          </FilterPill>

          {/* Clear all */}
          {activeFilterCount > 1 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      {!isFilterLoading && displayItems.length > 0 && (
        <p className="mb-3 text-sm text-muted-foreground">
          Showing {displayItems.length} of {total} inspection
          {total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Skeleton — initial load + filter changes */}
      {isFilterLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isFilterLoading && displayItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-base font-semibold text-foreground">
            No inspections found
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters."
              : "Start tracking quality defects by logging your first inspection."}
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={openLogDialog}>
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
      {!isFilterLoading && displayItems.length > 0 && (
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

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Load-more skeletons (infinite scroll) */}
      {isLoading && isLoadMoreRef.current && (
        <div className="mt-4 space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

    </div>
  );
}
