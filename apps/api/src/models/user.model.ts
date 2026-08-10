/**
 * User model — all database operations related to the users table.
 *
 * Responsibilities:
 *  - Look up a user by username (used during login)
 *  - Check whether a username is already taken (used during registration)
 *  - Insert a new user row and return the generated id
 *
 * Password hashing is NOT done here; it belongs in AuthController so the
 * model stays a pure data-access layer with no business logic.
 */

import { db } from '../db/database';

/** Raw row shape returned by the users table */
export interface DbUser {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}

export const UserModel = {
  /** Fetch a single user by username, or null if not found */
  async findByUsername(username: string): Promise<DbUser | null> {
    const result = await db.execute({
      sql:  'SELECT * FROM users WHERE username = ?',
      args: [username],
    });
    return result.rows.length > 0 ? (result.rows[0] as unknown as DbUser) : null;
  },

  /** Returns true if a user with the given username already exists */
  async exists(username: string): Promise<boolean> {
    const result = await db.execute({
      sql:  'SELECT id FROM users WHERE username = ?',
      args: [username],
    });
    return result.rows.length > 0;
  },

  /**
   * Insert a new user and return the auto-generated id.
   * The caller (AuthController) is responsible for hashing the password
   * before passing it here.
   */
  async create(username: string, passwordHash: string, role: string): Promise<number> {
    const result = await db.execute({
      sql:  'INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)',
      args: [username, passwordHash, role],
    });
    return Number(result.lastInsertRowid);
  },
};
