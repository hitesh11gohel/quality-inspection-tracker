# Quality Inspection Tracker

A full-stack monorepo application for logging, tracking, and resolving fabric-production defects across machine lines. Built for shop-floor supervisors who need a fast, mobile-friendly tool and for admins who need at-a-glance quality metrics.

---

## Quick Start (< 5 minutes)

### Prerequisites

- **Node.js** 18 or later — [nodejs.org](https://nodejs.org)
- **pnpm** 9 — `npm install -g pnpm@9`

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd quality-inspection-tracker

# 2. Install all workspace dependencies
pnpm install

# 3. Configure the API environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env if you want a custom JWT secret or DB path (defaults work fine for local dev)

# 4. Start both servers (frontend + backend) in parallel
pnpm dev
```

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:5173      |
| API      | http://localhost:3001      |

### Demo credentials

The database seeds two accounts on first run:

| Username  | Password   | Role       |
|-----------|------------|------------|
| `admin`   | `admin123` | Admin      |
| `user1`   | `user123`  | Supervisor |

---

## Architecture Decisions

### 1. Monorepo with Turborepo

The frontend, backend, and shared type package live in a single repository managed by Turborepo and pnpm workspaces. This eliminates the need to publish/version the shared types package while still keeping a clean separation of concerns — `@qit/shared` is imported by both `apps/api` and `apps/web` with full TypeScript safety. Turborepo's task pipeline ensures the shared package builds before either app starts, and its caching means incremental rebuilds stay fast.

### 2. SQLite (via libsql) over PostgreSQL

An embedded SQLite database requires zero infrastructure — no Docker, no connection strings, no managed cloud service. For an internal quality-tracking tool used within a single plant, SQLite handles the concurrency and data-volume requirements with ease. If the tool ever needs to scale to multiple plants sharing a single database, migrating to Turso (libsql's cloud offering) or PostgreSQL requires minimal code changes since the `@libsql/client` API is compatible with both.

### 3. Redux Toolkit over React Query

Inspection filters (severity, status, date range, search, sort) are shared across the Inspections list page and the Dashboard, and they need to survive navigation between routes. Redux Toolkit gives a single source of truth for this cross-page state without prop-drilling or context gymnastics. For a purely server-state problem React Query would be simpler, but the filter and pagination state that lives alongside the fetched data tips the balance toward Redux.

### 4. Mobile-first bottom-nav pattern

Supervisors log defects on the shop floor using their phones. The bottom navigation bar keeps all primary actions reachable with one thumb, and the compact card layout prioritises the most critical information (severity, status) at a glance. The layout progressively enhances to a sidebar on tablet/desktop so admin users at a desk also get a comfortable experience.

### 5. JWT over session auth

JWTs are stateless — the server does not need to store or look up session records. This keeps the API horizontally scalable (add more Node processes without a shared session store) and removes a dependency on Redis or a sessions table. The short-lived access token is stored in memory (Redux state) so it is cleared on page reload, which is an acceptable trade-off for an internal tool where users are always on trusted devices.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

| Method | Path                       | Auth | Description                                      |
|--------|----------------------------|------|--------------------------------------------------|
| POST   | `/api/auth/login`          | No   | Authenticate with username + password; returns JWT |
| POST   | `/api/auth/register`       | No   | Create a new supervisor account                  |
| GET    | `/api/auth/me`             | Yes  | Return the current authenticated user            |
| GET    | `/api/inspections`         | Yes  | List inspections (filterable, paginated, sortable) |
| POST   | `/api/inspections`         | Yes  | Create a new inspection record                   |
| GET    | `/api/inspections/:id`     | Yes  | Fetch a single inspection by ID                  |
| PATCH  | `/api/inspections/:id`     | Yes  | Update an inspection (e.g. resolve it)           |
| DELETE | `/api/inspections/:id`     | Yes  | Delete an inspection (admin only)                |
| GET    | `/api/summary`             | Yes  | Aggregate stats: totals, open/resolved by severity |

### Query parameters for `GET /api/inspections`

| Param      | Type                               | Description               |
|------------|------------------------------------|---------------------------|
| `search`   | string                             | Filter by machine line ID |
| `severity` | `Critical` \| `Major` \| `Minor`  | Filter by severity        |
| `status`   | `Open` \| `Resolved`              | Filter by status          |
| `dateFrom` | `YYYY-MM-DD`                       | Start of date range       |
| `dateTo`   | `YYYY-MM-DD`                       | End of date range         |
| `sortBy`   | `date` \| `severity` \| `createdAt` | Sort field              |
| `sortOrder`| `asc` \| `desc`                   | Sort direction            |
| `page`     | number                             | Page number (default: 1)  |
| `limit`    | number                             | Results per page (default: 20) |

---

## Folder Structure

```
quality-inspection-tracker/
├── apps/
│   ├── api/                        # Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── controllers/        # Request handlers (auth, inspections, summary)
│   │   │   ├── routes/             # Express route definitions
│   │   │   ├── models/             # Database query functions
│   │   │   ├── db/                 # DB client, migrations, seed data
│   │   │   ├── middleware/         # JWT auth guard, error handler
│   │   │   └── index.ts            # Server entry point
│   │   └── .env.example
│   │
│   └── web/                        # React 18 + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/             # Shadcn/Radix primitive components
│       │   │   ├── layout/         # AppLayout, ProtectedRoute
│       │   │   └── inspections/    # Feature-specific components (ResolveDialog)
│       │   ├── pages/              # One file per route (Dashboard, Log, List, Detail, Profile)
│       │   ├── store/              # Redux store + slices (auth, inspections, summary)
│       │   ├── services/           # Axios API wrappers
│       │   └── lib/                # Utilities (severity colours, date formatting)
│       └── .env.example
│
├── packages/
│   └── shared/                     # Zero-dependency type definitions
│       └── src/
│           ├── types.ts            # Inspection, User, Severity, Status, etc.
│           └── constants.ts        # SEVERITIES, STATUSES arrays
│
├── turbo.json                      # Turborepo task pipeline
├── pnpm-workspace.yaml
└── package.json                    # Root scripts: dev, build, start, lint
```

---

## What I Would Do Differently With More Time

- **Real-time updates via WebSocket** — right now the dashboard polls every 60 seconds. A Socket.io or native WebSocket connection would push defect events to all connected supervisors instantly, which matters when a critical defect is logged on the floor.

- **Photo attachments for defects** — supervisors should be able to attach a photo of the defect at the time of logging. This would require an object-storage integration (S3-compatible) and a `photos` table linked to inspections.

- **Offline-first PWA** — shop floors often have poor Wi-Fi. A service worker with a background sync queue would let supervisors log inspections offline and flush them when connectivity returns.

- **Proper test suite** — the application has no automated tests. I would add Vitest + React Testing Library for component tests, Supertest for API integration tests against a real (in-memory) SQLite instance, and Playwright for critical end-to-end flows (login → log inspection → resolve).

- **PostgreSQL migration for multi-plant scale** — SQLite is perfect for a single embedded deployment, but a larger organisation with multiple plants sharing one API server would need a proper client-server database. The libsql client API is already compatible with Turso (distributed SQLite) or can be swapped for pg with minimal model-layer changes.

---

## Assumptions

| Ambiguity | Resolution |
|-----------|------------|
| **Authentication scope** | Only supervisors and admins are modelled. No guest/read-only role was specified, so all routes require a valid JWT. |
| **Delete permissions** | The spec did not define who can delete inspections. I restricted DELETE to the `admin` role to prevent accidental data loss by supervisors. |
| **Defect types** | The list (`Weave Defect`, `Shade Variation`, `Hole/Tear`, `Count Deviation`, `Other`) was inferred from the domain context of textile manufacturing. |
| **Resolution workflow** | Resolving an inspection requires a `resolutionNote`. This is enforced on the frontend but not at the database level, keeping the schema flexible. |
| **Date storage** | Inspection `date` stores a `YYYY-MM-DD` string (the day the defect was found), while `createdAt`/`updatedAt` are full ISO timestamps. |
| **Pagination default** | API defaults to 20 results per page. The dashboard fetches the 5 most recent for the preview list. |
