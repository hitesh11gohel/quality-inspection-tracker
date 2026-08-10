/**
 * Summary routes — requires a valid JWT.
 *
 * GET /api/summary → aggregated inspection statistics for the dashboard
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { SummaryController } from '../controllers/summary.controller';

const router = Router();

// Protect with JWT — only logged-in users can view the dashboard stats
router.use(authenticate);

router.get('/', SummaryController.getStats);

export default router;
