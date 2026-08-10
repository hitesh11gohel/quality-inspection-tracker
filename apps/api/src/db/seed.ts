/**
 * Database seeder.
 *
 * Inserts a single demo user on first boot so reviewers and testers can log in
 * immediately without having to call /api/auth/register first.
 *
 * Demo credentials → username: supervisor  password: password123
 *
 * The seed is skipped if the users table already contains at least one row,
 * making it safe to run on every server startup.
 */

import bcrypt from 'bcryptjs';
import { db } from './database';

export async function seedDemoUser(): Promise<void> {
  const result = await db.execute('SELECT COUNT(*) as count FROM users');
  const count  = Number(result.rows[0].count);

  // Skip seeding if any user already exists
  if (count > 0) return;

  // Hash with saltRounds=10 — matches the same cost factor used in AuthController
  const passwordHash = bcrypt.hashSync('password123', 10);

  await db.execute({
    sql:  'INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)',
    args: ['supervisor', passwordHash, 'supervisor'],
  });

  console.log('Demo user seeded → username: supervisor  password: password123');
}
