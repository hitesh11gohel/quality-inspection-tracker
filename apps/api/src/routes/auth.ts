/**
 * Auth routes — public endpoints, no JWT required.
 *
 * POST /api/auth/register  → create a new account
 * POST /api/auth/login     → authenticate and receive a JWT
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);

export default router;
