/**
 * Inspection service — typed wrappers over the inspections + summary API endpoints.
 *
 * All functions throw an Error with the server's error message on failure
 * so Redux thunks can catch it and pass it to rejectWithValue.
 */

import type { ApiResponse, Inspection, InspectionFilters, SummaryStats } from '@qit/shared';
import api from '@/lib/axios';

/** Shape returned by GET /api/inspections */
interface InspectionListResult {
  inspections: Inspection[];
  total: number;
  page: number;
  limit: number;
}

/** Fields required to create a new inspection (backend sets id, status, timestamps) */
type CreateInspectionData = Omit<
  Inspection,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'createdBy'
>;

export const inspectionService = {
  /**
   * Fetch a paginated, filtered list of inspections.
   * Axios serialises the filters object into query params, omitting undefined values automatically.
   */
  async getInspections(filters: InspectionFilters): Promise<InspectionListResult> {
    const res = await api.get<ApiResponse<InspectionListResult>>('/inspections', {
      params: filters,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error ?? 'Failed to fetch inspections');
    }
    return res.data.data;
  },

  /** Create a new Open inspection and return the full saved record */
  async createInspection(data: CreateInspectionData): Promise<Inspection> {
    const res = await api.post<ApiResponse<Inspection>>('/inspections', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error ?? 'Failed to create inspection');
    }
    return res.data.data;
  },

  /** Fetch a single inspection by id */
  async getInspection(id: number): Promise<Inspection> {
    const res = await api.get<ApiResponse<Inspection>>(`/inspections/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error ?? 'Inspection not found');
    }
    return res.data.data;
  },

  /** Mark an inspection as Resolved with a mandatory resolution note */
  async resolveInspection(id: number, resolutionNote: string): Promise<Inspection> {
    const res = await api.patch<ApiResponse<Inspection>>(`/inspections/${id}/resolve`, {
      resolutionNote,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error ?? 'Failed to resolve inspection');
    }
    return res.data.data;
  },

  /** Hard-delete an inspection (admin only — server enforces 403 for non-admins) */
  async deleteInspection(id: number): Promise<void> {
    const res = await api.delete<ApiResponse<null>>(`/inspections/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error ?? 'Failed to delete inspection');
    }
  },

  /** Fetch aggregated summary statistics for the dashboard */
  async getSummary(): Promise<SummaryStats> {
    const res = await api.get<ApiResponse<SummaryStats>>('/summary');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error ?? 'Failed to fetch summary');
    }
    return res.data.data;
  },
};
