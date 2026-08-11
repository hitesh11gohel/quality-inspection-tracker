/**
 * Inspection controller — handles all CRUD operations for inspection records.
 *
 * Routes handled:
 *  GET    /api/inspections              → paginated list with filters & search
 *  POST   /api/inspections              → create a new Open inspection
 *  GET    /api/inspections/:id          → fetch a single inspection by id
 *  PATCH  /api/inspections/:id/resolve  → mark an inspection as Resolved
 *  DELETE /api/inspections/:id          → hard-delete (admin only)
 *
 * Role-based access control:
 *  - All authenticated users can read any inspection.
 *  - Supervisors can only resolve inspections they created (createdBy === userId).
 *  - Admins can resolve and delete any inspection.
 */

import type { Request, Response } from 'express';
import type { Inspection } from '@qit/shared';
import { DEFECT_TYPES, SEVERITIES, STATUSES } from '@qit/shared';
import { InspectionModel } from '../models/inspection.model';
import { sendError, sendSuccess } from '../utils/response';

const VALID_SORT_COLS = ['date', 'severity', 'createdAt'];

export const InspectionController = {
  /**
   * GET /api/inspections
   *
   * Supported query params:
   *  search     — free-text match on machineLineId, remarks, defectType
   *  severity   — Critical | Major | Minor
   *  status     — Open | Resolved
   *  dateFrom   — YYYY-MM-DD (inclusive)
   *  dateTo     — YYYY-MM-DD (inclusive)
   *  page       — page number, default 1
   *  limit      — items per page, default 20, max 100
   *  sortBy     — date | severity | createdAt (default: createdAt)
   *  sortOrder  — asc | desc (default: desc)
   */
  async list(req: Request, res: Response): Promise<void> {
    const q = req.query as Record<string, string | undefined>;
    const { severity, status, dateFrom, dateTo } = q;
    const term      = q.search?.trim() || undefined;
    const sortBy    = q.sortBy    ?? 'createdAt';
    const sortOrder = q.sortOrder ?? 'desc';

    const page  = Math.max(1, parseInt(q.page  ?? '1',  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? '20', 10) || 20));

    if (!VALID_SORT_COLS.includes(sortBy)) {
      sendError(res, 'sortBy must be date, severity, or createdAt', 400);
      return;
    }
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sendError(res, 'sortOrder must be asc or desc', 400);
      return;
    }
    if (severity && !SEVERITIES.includes(severity as Inspection['severity'])) {
      sendError(res, `Invalid severity "${severity}". Must be one of: ${SEVERITIES.join(', ')}`, 400);
      return;
    }
    if (status && !STATUSES.includes(status as Inspection['status'])) {
      sendError(res, `Invalid status "${status}". Must be one of: ${STATUSES.join(', ')}`, 400);
      return;
    }

    const data = await InspectionModel.findAll({
      search: term, severity, status, dateFrom, dateTo, page, limit, sortBy, sortOrder,
    });

    const message = data.total === 0
      ? term
        ? `No inspections found matching "${term}"`
        : 'No inspections found for the selected filters'
      : `Showing ${data.inspections.length} of ${data.total} inspection${data.total !== 1 ? 's' : ''}${term ? ` matching "${term}"` : ''}`;

    sendSuccess(res, data, 200, message);
  },

  /**
   * POST /api/inspections
   * Creates a new inspection with status defaulting to 'Open'.
   * The authenticated user's id is stored as createdBy.
   */
  async create(req: Request, res: Response): Promise<void> {
    const { date, machineLineId, defectType, severity, remarks } = req.body as {
      date?: string;
      machineLineId?: string;
      defectType?: string;
      severity?: string;
      remarks?: string;
    };

    if (!date || !machineLineId?.trim() || !defectType || !severity) {
      sendError(res, 'date, machineLineId, defectType, and severity are required', 400);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      sendError(res, 'date must be in YYYY-MM-DD format', 400);
      return;
    }
    if (!DEFECT_TYPES.includes(defectType as Inspection['defectType'])) {
      sendError(res, `Invalid defectType "${defectType}". Must be one of: ${DEFECT_TYPES.join(', ')}`, 400);
      return;
    }
    if (!SEVERITIES.includes(severity as Inspection['severity'])) {
      sendError(res, `Invalid severity "${severity}". Must be one of: ${SEVERITIES.join(', ')}`, 400);
      return;
    }

    const inspection = await InspectionModel.create({
      date, machineLineId, defectType, severity, remarks,
      createdBy: req.user!.userId,
    });

    sendSuccess(
      res,
      inspection,
      201,
      `Inspection #${inspection.id} recorded successfully on machine line ${machineLineId}`
    );
  },

  /** GET /api/inspections/:id — fetch one inspection record */
  async getById(req: Request, res: Response): Promise<void> {
    const inspection = await InspectionModel.findById(req.params.id);
    if (!inspection) {
      sendError(res, `Inspection #${req.params.id} not found`, 404);
      return;
    }
    sendSuccess(res, inspection, 200, `Inspection #${inspection.id} fetched successfully`);
  },

  /**
   * PATCH /api/inspections/:id/resolve
   *
   * Transitions an inspection from Open → Resolved.
   * A non-empty resolutionNote is required so there is always a paper trail.
   *
   * RBAC:
   *  - admin     → can resolve any inspection
   *  - supervisor → can only resolve inspections they created (createdBy === userId)
   */
  async resolve(req: Request, res: Response): Promise<void> {
    const { resolutionNote } = req.body as { resolutionNote?: string };

    if (!resolutionNote || resolutionNote.trim().length === 0) {
      sendError(res, 'resolutionNote is required to resolve an inspection', 400);
      return;
    }

    const existing = await InspectionModel.findById(req.params.id);
    if (!existing) {
      sendError(res, `Inspection #${req.params.id} not found`, 404);
      return;
    }

    if (req.user!.role === 'supervisor' && existing.createdBy !== req.user!.userId) {
      sendError(res, 'You can only resolve your own inspections', 403);
      return;
    }

    const inspection = await InspectionModel.resolve(req.params.id, resolutionNote.trim());
    sendSuccess(
      res,
      inspection!,
      200,
      `Inspection #${inspection!.id} has been marked as resolved`
    );
  },

  /**
   * DELETE /api/inspections/:id
   *
   * Hard-deletes a single inspection record.
   * Restricted to admins — supervisors receive 403.
   */
  async remove(req: Request, res: Response): Promise<void> {
    if (req.user!.role !== 'admin') {
      sendError(res, 'Only admins can delete inspections', 403);
      return;
    }

    const deleted = await InspectionModel.remove(req.params.id);
    if (!deleted) {
      sendError(res, `Inspection #${req.params.id} not found`, 404);
      return;
    }

    sendSuccess(res, null, 200, `Inspection #${req.params.id} deleted successfully`);
  },
};
