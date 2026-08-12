import type { Severity, Status } from "@qit/shared";

// ── Sort ──────────────────────────────────────────────────────────────────────

export const SORT_OPTIONS = [
  { label: "Date (Newest)", value: "date-desc" },
  { label: "Date (Oldest)", value: "date-asc" },
  { label: "Severity", value: "severity-desc" },
  { label: "Created At", value: "createdAt-desc" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ── Date presets ───────────────────────────────────────────────────────────────

export type DatePreset = "7d" | "15d" | "1m" | "1q" | "custom" | "";

export const DATE_PRESETS: {
  label: string;
  value: DatePreset;
  days?: number;
}[] = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 15 days", value: "15d", days: 15 },
  { label: "Last month", value: "1m", days: 30 },
  { label: "Last quarter", value: "1q", days: 90 },
  { label: "Custom range", value: "custom" },
];

// ── Dot indicators ─────────────────────────────────────────────────────────────

export const SEV_DOT: Record<Severity, string> = {
  Critical: "bg-red-500",
  Major: "bg-amber-500",
  Minor: "bg-green-500",
};

export const STATUS_DOT: Record<Status, string> = {
  Open: "bg-blue-500",
  Resolved: "bg-green-500",
};

// ── Badge styles (shared across list + detail) ────────────────────────────────

export const SEVERITY_BADGE: Record<Severity, string> = {
  Critical: "bg-red-100 text-red-700 border border-red-200",
  Major: "bg-amber-100 text-amber-700 border border-amber-200",
  Minor: "bg-green-100 text-green-700 border border-green-200",
};

export const STATUS_BADGE: Record<Status, string> = {
  Open: "border border-blue-400 text-blue-600",
  Resolved: "bg-green-500 text-white",
};

// ── Misc ───────────────────────────────────────────────────────────────────────

export const REMARKS_LIMIT = 120;
