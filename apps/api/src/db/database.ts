/**
 * Database connection singleton.
 *
 * Uses @libsql/client (WASM-based SQLite) instead of better-sqlite3 so the
 * project installs on any machine without C++ build tools.
 *
 * The client is created once and reused across the entire application.
 * DB file path is configured via DB_PATH in .env (default: ./data/qit.db).
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || './data/qit.db';
const dbDir  = path.dirname(path.resolve(dbPath));

// Create the data directory if it does not exist so the DB file can be written
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// file: prefix tells libsql to use a local SQLite file (not a remote Turso URL)
export const db = createClient({ url: `file:${path.resolve(dbPath)}` });
