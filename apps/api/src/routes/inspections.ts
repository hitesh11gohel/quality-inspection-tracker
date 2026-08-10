/**
 * Inspection routes — all endpoints require a valid JWT.
 *
 * GET    /api/inspections              → paginated list with filters & search
 * POST   /api/inspections              → create a new inspection
 * GET    /api/inspections/:id          → get a single inspection
 * PATCH  /api/inspections/:id/resolve  → mark an inspection as Resolved
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { InspectionController } from '../controllers/inspection.controller';

const router = Router();

// Protect every inspection route with JWT verification
router.use(authenticate);

router.get('/',              InspectionController.list);
router.post('/',             InspectionController.create);
router.get('/:id',           InspectionController.getById);
router.patch('/:id/resolve', InspectionController.resolve);

// ── DELETE /api/inspections/:id — intentionally not implemented ───────────────
//
// Inspection records are compliance / audit data. Permanently deleting them
// would destroy the defect history that quality teams and auditors rely on.
//
// If a "remove" feature is ever needed, the correct approach is a soft delete:
//   ALTER TABLE inspections ADD COLUMN deletedAt TEXT;
//   UPDATE inspections SET deletedAt = datetime('now') WHERE id = ?;
//   -- then filter WHERE deletedAt IS NULL in all SELECT queries
//
// Soft delete keeps the full audit trail, is reversible, and does not open a
// hard-delete attack surface that could be misused to cover up defect records.
// ─────────────────────────────────────────────────────────────────────────────

export default router;
