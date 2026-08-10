export type DefectType =
  | 'Weave Defect'
  | 'Shade Variation'
  | 'Hole/Tear'
  | 'Count Deviation'
  | 'Other';

export type Severity = 'Critical' | 'Major' | 'Minor';
export type Status = 'Open' | 'Resolved';

export interface Inspection {
  id: number;
  date: string;           // ISO date string YYYY-MM-DD
  machineLineId: string;
  defectType: DefectType;
  severity: Severity;
  status: Status;
  remarks?: string;
  resolutionNote?: string;
  resolvedAt?: string;    // ISO timestamp
  createdAt: string;      // ISO timestamp
  updatedAt: string;      // ISO timestamp
  createdBy?: number;     // user id
}

export interface User {
  id: number;
  username: string;
  role: 'supervisor' | 'admin';
}

export interface AuthTokenPayload {
  userId: number;
  username: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface InspectionFilters {
  severity?: Severity;
  status?: Status;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'severity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SummaryStats {
  total: number;
  open: number;
  resolved: number;
  bySeverity: {
    Critical: { open: number; resolved: number; total: number };
    Major: { open: number; resolved: number; total: number };
    Minor: { open: number; resolved: number; total: number };
  };
}
