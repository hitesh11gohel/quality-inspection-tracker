import type { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { sendError, sendSuccess } from '../utils/response';

export const UserController = {
  /** GET /api/users — list all users (admin only) */
  async listAll(_req: Request, res: Response): Promise<void> {
    const users = await UserModel.findAll();
    sendSuccess(res, users);
  },

  /** PUT /api/users/me — update the authenticated user's username */
  async updateUsername(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { username } = req.body as { username?: string };

    if (!username?.trim()) {
      sendError(res, 'username is required', 400);
      return;
    }

    const existing = await UserModel.findByUsername(username.trim());
    if (existing && existing.id !== userId) {
      sendError(res, `Username "${username}" is already taken`, 400);
      return;
    }

    await UserModel.updateUsername(userId, username.trim());
    const updated = await UserModel.findById(userId);
    sendSuccess(res, { id: updated!.id, username: updated!.username, role: updated!.role }, 200, 'Username updated');
  },

  /** PUT /api/users/:id/role — update any user's role (admin only) */
  async updateRole(req: Request, res: Response): Promise<void> {
    const targetId = parseInt(req.params.id, 10);
    const { role } = req.body as { role?: string };

    if (isNaN(targetId)) {
      sendError(res, 'Invalid user id', 400);
      return;
    }

    if (!['supervisor', 'admin'].includes(role ?? '')) {
      sendError(res, 'role must be supervisor or admin', 400);
      return;
    }

    const user = await UserModel.findById(targetId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    await UserModel.updateRole(targetId, role!);
    sendSuccess(res, { id: user.id, username: user.username, role }, 200, 'Role updated');
  },
};
