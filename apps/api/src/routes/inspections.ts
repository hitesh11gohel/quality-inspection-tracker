/**
 * Inspection routes — all endpoints require a valid JWT.
 *
 * GET    /api/inspections              → paginated list with filters & search
 * POST   /api/inspections              → create a new inspection
 * GET    /api/inspections/:id          → get a single inspection
 * PATCH  /api/inspections/:id/resolve  → mark an inspection as Resolved (RBAC enforced in controller)
 * DELETE /api/inspections/:id          → hard-delete (admin only, enforced in controller)
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { InspectionController } from '../controllers/inspection.controller';

const router = Router();

router.use(authenticate);

router.get('/',              InspectionController.list);
router.post('/',             InspectionController.create);
router.get('/:id',           InspectionController.getById);
router.patch('/:id/resolve', InspectionController.resolve);
router.delete('/:id',        InspectionController.remove);

export default router;
