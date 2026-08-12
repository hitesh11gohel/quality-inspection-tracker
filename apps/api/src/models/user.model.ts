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

export type PublicUser = Omit<DbUser, 'passwordHash'>;

export const UserModel = {
  /** Fetch a single user by username, or null if not found */
  async findByUsername(username: string): Promise<DbUser | null> {
    const result = await db.execute({
      sql:  'SELECT * FROM users WHERE username = ?',
      args: [username],
    });
    return result.rows.length > 0 ? (result.rows[0] as unknown as DbUser) : null;
  },

  /** Fetch a single user by id, or null if not found */
  async findById(id: number): Promise<DbUser | null> {
    const result = await db.execute({
      sql:  'SELECT * FROM users WHERE id = ?',
      args: [id],
    });
    return result.rows.length > 0 ? (result.rows[0] as unknown as DbUser) : null;
  },

  /** Return all users (without password hashes), ordered by id */
  async findAll(): Promise<PublicUser[]> {
    const result = await db.execute(
      'SELECT id, username, role, createdAt FROM users ORDER BY id ASC'
    );
    return result.rows as unknown as PublicUser[];
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

  /** Update a user's username */
  async updateUsername(id: number, username: string): Promise<void> {
    await db.execute({
      sql:  'UPDATE users SET username = ? WHERE id = ?',
      args: [username, id],
    });
  },

  /** Update a user's role */
  async updateRole(id: number, role: string): Promise<void> {
    await db.execute({
      sql:  'UPDATE users SET role = ? WHERE id = ?',
      args: [role, id],
    });
  },
};
