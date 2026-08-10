/**
 * Entry point for the QIT (Quality Inspection Tracker) API server.
 *
 * Responsibilities:
 *  - Load environment variables from .env
 *  - Configure Express middleware (security headers, CORS, JSON body parsing)
 *  - Mount route groups under /api
 *  - Run DB migrations and seed demo data before accepting connections
 */

import 'dotenv/config';
import 'express-async-errors'; // patches Express 4 so async route errors flow to errorHandler
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { runMigrations } from './db/migrations';
import { seedDemoUser } from './db/seed';
import authRoutes from './routes/auth';
import inspectionRoutes from './routes/inspections';
import summaryRoutes from './routes/summary';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Support comma-separated origins in ALLOWED_ORIGINS, e.g. "http://localhost:5173,https://app.example.com"
// Wildcard '*' allows all origins (development default)
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '*')
  .split(',')
  .map((o) => o.trim());

// helmet sets secure HTTP response headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet());

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);        // POST /api/auth/register  POST /api/auth/login
app.use('/api/inspections', inspectionRoutes);  // CRUD for inspection records
app.use('/api/summary',     summaryRoutes);     // GET  /api/summary — aggregated stats

// Simple liveness check used by uptime monitors / Docker healthcheck
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'QIT API is running' });
});

// Global error handler — must be registered after all routes
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  await runMigrations(); // ensure DB schema is up to date
  await seedDemoUser();  // insert demo user if the users table is empty
  app.listen(PORT, () => {
    console.log(`QIT API listening on http://localhost:${PORT}`);
  });
}

start();
