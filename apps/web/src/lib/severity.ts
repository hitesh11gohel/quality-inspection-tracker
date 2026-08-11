import type { Severity, Status } from '@qit/shared';

export function getSeverityColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    Critical: 'text-red-600',
    Major: 'text-amber-600',
    Minor: 'text-green-600',
  };
  return map[severity];
}

export function getSeverityBadgeVariant(severity: Severity): 'destructive' | 'default' | 'secondary' | 'outline' {
  const map: Record<Severity, 'destructive' | 'default' | 'secondary' | 'outline'> = {
    Critical: 'destructive',
    Major: 'default',
    Minor: 'secondary',
  };
  return map[severity];
}

export function getSeverityBadgeClass(severity: Severity): string {
  const map: Record<Severity, string> = {
    Critical: 'bg-red-50 text-red-700 border-red-200',
    Major: 'bg-amber-50 text-amber-700 border-amber-200',
    Minor: 'bg-green-50 text-green-700 border-green-200',
  };
  return map[severity];
}

export function getStatusColor(status: Status): string {
  const map: Record<Status, string> = {
    Open: 'text-orange-600',
    Resolved: 'text-emerald-600',
  };
  return map[status];
}

export function getStatusBadgeClass(status: Status): string {
  const map: Record<Status, string> = {
    Open: 'bg-orange-50 text-orange-700 border-orange-200',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return map[status];
}
