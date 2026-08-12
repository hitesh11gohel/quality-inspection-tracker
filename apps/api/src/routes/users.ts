import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { adminOnly, authenticate } from '../middleware/auth';

const router = Router();

// All user routes require a valid JWT
router.use(authenticate);

router.get('/',          adminOnly, UserController.listAll);
router.put('/me',                   UserController.updateUsername);
router.put('/:id/role',  adminOnly, UserController.updateRole);

export default router;
