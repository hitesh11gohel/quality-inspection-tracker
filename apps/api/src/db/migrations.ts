/**
 * Database migrations.
 *
 * Runs once at server startup (before any request is handled).
 * All statements use CREATE TABLE IF NOT EXISTS so they are safe to re-run
 * on every boot without destroying existing data.
 *
 * Schema:
 *  users       — stores authenticated users (supervisors / admins)
 *  inspections — core domain table; one row per quality defect recorded
 */

import { db } from './database';

export async function runMigrations(): Promise<void> {
  // WAL mode allows concurrent reads while a write is in progress
  await db.execute('PRAGMA journal_mode = WAL');

  // Enforce referential integrity so createdBy always points to a valid user
  await db.execute('PRAGMA foreign_keys = ON');

  // ── users ──────────────────────────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role         TEXT DEFAULT 'supervisor', -- 'supervisor' | 'admin'
      createdAt    TEXT DEFAULT (datetime('now'))
    )
  `);

  // ── inspections ────────────────────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS inspections (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      date           TEXT NOT NULL,            -- YYYY-MM-DD, the day the defect was found
      machineLineId  TEXT NOT NULL,            -- e.g. "ML-01"
      defectType     TEXT NOT NULL,            -- one of DEFECT_TYPES constant
      severity       TEXT NOT NULL,            -- Critical | Major | Minor
      status         TEXT DEFAULT 'Open',      -- Open | Resolved
      remarks        TEXT,                     -- optional notes at time of logging
      resolutionNote TEXT,                     -- filled when status changes to Resolved
      resolvedAt     TEXT,                     -- ISO timestamp of resolution
      createdBy      INTEGER REFERENCES users(id),
      createdAt      TEXT DEFAULT (datetime('now')),
      updatedAt      TEXT DEFAULT (datetime('now'))
    )
  `);
}
