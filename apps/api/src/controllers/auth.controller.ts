/**
 * Auth controller — handles user registration and login.
 *
 * Routes handled:
 *  POST /api/auth/register  → create a new account
 *  POST /api/auth/login     → authenticate and receive a JWT
 *
 * On successful login the controller returns a signed JWT (24 h expiry) plus
 * the public user object. The frontend stores the token and sends it with every
 * subsequent request via the Authorization: Bearer header.
 */

import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@qit/shared';
import { UserModel } from '../models/user.model';
import { sendError, sendSuccess } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

export const AuthController = {
  /** Register a new user account */
  async register(req: Request, res: Response): Promise<void> {
    const { username, password, role = 'supervisor' } = req.body as {
      username?: string;
      password?: string;
      role?: string;
    };

    // Basic presence validation
    if (!username?.trim() || !password) {
      sendError(res, 'username and password are required', 400);
      return;
    }

    // Only two roles are supported in this system
    if (!['supervisor', 'admin'].includes(role)) {
      sendError(res, 'role must be supervisor or admin', 400);
      return;
    }

    // Prevent duplicate usernames before attempting the INSERT
    if (await UserModel.exists(username)) {
      sendError(res, `Username "${username}" is already taken`, 400);
      return;
    }

    // Hash the password with saltRounds=10 before persisting
    const passwordHash = bcrypt.hashSync(password, 10);
    const id = await UserModel.create(username, passwordHash, role);

    // Return the public user shape — never return the password hash
    sendSuccess(
      res,
      { id, username, role } as User,
      201,
      'Account created successfully. You can now log in.'
    );
  },

  /** Authenticate a user and return a signed JWT */
  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username?.trim() || !password) {
      sendError(res, 'username and password are required', 400);
      return;
    }

    const dbUser = await UserModel.findByUsername(username);

    // Combine "user not found" and "wrong password" into a single generic message
    // to prevent username enumeration attacks
    if (!dbUser || !bcrypt.compareSync(password, dbUser.passwordHash)) {
      sendError(res, 'Invalid username or password', 401);
      return;
    }

    // Sign the JWT with userId, username and role so middleware can
    // authorise requests without an extra DB lookup on every call
    const token = jwt.sign(
      { userId: dbUser.id, username: dbUser.username, role: dbUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const user: User = { id: dbUser.id, username: dbUser.username, role: dbUser.role as User['role'] };
    sendSuccess(res, { token, user }, 200, `Welcome back, ${dbUser.username}!`);
  },
};
