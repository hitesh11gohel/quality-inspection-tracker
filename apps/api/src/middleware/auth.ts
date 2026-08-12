/**
 * Authentication middleware.
 *
 * Verifies the JWT included in every protected request and attaches the decoded
 * payload to req.user so downstream controllers can read userId / role without
 * hitting the database again.
 *
 * Accepted token locations (checked in order):
 *  1. Authorization: Bearer <token>  — standard HTTP convention
 *  2. x-auth-token: <token>          — convenience header for quick testing
 */

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthTokenPayload } from '@qit/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

// Extend Express's Request type so TypeScript knows req.user exists on
// authenticated routes without requiring a non-null assertion everywhere
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const bearerHeader = req.headers.authorization;

  // Extract token from whichever header is present
  const token =
    (bearerHeader?.startsWith('Bearer ') ? bearerHeader.slice(7) : null) ??
    (req.headers['x-auth-token'] as string | undefined) ??
    null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Missing token: provide Authorization: Bearer <token> or x-auth-token header',
    });
    return;
  }

  try {
    // jwt.verify throws if the token is expired, tampered with, or signed with a different secret
    req.user = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
