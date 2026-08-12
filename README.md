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

The database seeds one account on first run. Register additional accounts via the UI or API.

| Username     | Password      | Role       |
|--------------|---------------|------------|
| `supervisor` | `password123` | Supervisor |

To create an admin account, register via `POST /api/auth/register` with `"role": "admin"`, or promote an existing user from the **Manage Users** page once an admin account exists.

---

## Features

### Core
- **Log inspections** — date, machine/line ID, defect type, severity, optional remarks; accessible from any page via the quick-log button
- **Inspections list** — sortable, filterable by severity, status (Open/Resolved), date range, and free-text machine search; paginated
- **Resolve inspections** — mark as Resolved with a mandatory resolution note
- **Summary dashboard** — KPI cards and a severity breakdown showing Open vs Resolved counts

### User management (beyond the original spec)
- **Profile page** — any logged-in user can update their own username via a modal
- **Manage Users page** (admin only) — view all users and change any user's role via an inline selector

### Auth
- JWT-based authentication (24 h tokens); two roles: `supervisor` and `admin`
- Admin role restricts: user listing, role changes, and inspection deletion

---

## Architecture Decisions

### 1. Monorepo with Turborepo

The frontend, backend, and shared type package live in a single repository managed by Turborepo and pnpm workspaces. This eliminates the need to publish/version the shared types package while still keeping a clean separation of concerns — `@qit/shared` is imported by both `apps/api` and `apps/web` with full TypeScript safety. Turborepo's task pipeline ensures the shared package builds before either app starts, and its caching means incremental rebuilds stay fast.

### 2. SQLite (via libsql) over PostgreSQL

An embedded SQLite database requires zero infrastructure — no Docker, no connection strings, no managed cloud service. For an internal quality-tracking tool used within a single plant, SQLite handles the concurrency and data-volume requirements with ease. If the tool ever needs to scale to multiple plants sharing a single database, migrating to Turso (libsql's cloud offering) or PostgreSQL requires minimal code changes since the `@libsql/client` API is compatible with both.

### 3. Redux Toolkit over React Query

Inspection filters (severity, status, date range, search, sort) are shared across the Inspections list page and the Dashboard, and they need to survive navigation between routes. Redux Toolkit gives a single source of truth for this cross-page state without prop-drilling or context gymnastics. For a purely server-state problem React Query would be simpler, but the filter and pagination state that lives alongside the fetched data tips the balance toward Redux.

### 4. Mobile-first bottom-nav pattern

Supervisors log defects on the shop floor using their phones. A persistent bottom navigation bar (Dashboard, Log, Inspections) keeps all primary actions reachable with one thumb, and the compact card layout prioritises the most critical information (severity, status) at a glance. On tablet and desktop the bottom nav is hidden and navigation moves to the sticky top header, where a Log Inspection button appears inline with the page title.

### 5. JWT over session auth

JWTs are stateless — the server does not need to store or look up session records. This keeps the API horizontally scalable (add more Node processes without a shared session store) and removes a dependency on Redis or a sessions table. The short-lived access token is stored in Redux state and localStorage so it survives a page refresh while remaining easy to clear on logout — an acceptable trade-off for an internal tool where users are on trusted devices.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Path                  | Auth | Description                                        |
|--------|-----------------------|------|----------------------------------------------------|
| POST   | `/api/auth/register`  | No   | Create a new account (`supervisor` or `admin` role) |
| POST   | `/api/auth/login`     | No   | Authenticate; returns a signed JWT and user object  |

### Inspections

| Method | Path                    | Auth          | Description                                        |
|--------|-------------------------|---------------|----------------------------------------------------|
| GET    | `/api/inspections`      | Any           | List inspections (filterable, paginated, sortable)  |
| POST   | `/api/inspections`      | Any           | Create a new inspection record                     |
| GET    | `/api/inspections/:id`  | Any           | Fetch a single inspection by ID                    |
| PATCH  | `/api/inspections/:id`  | Any           | Update an inspection (e.g. resolve it)             |
| DELETE | `/api/inspections/:id`  | Admin only    | Delete an inspection                               |

### Summary

| Method | Path           | Auth | Description                                        |
|--------|----------------|------|----------------------------------------------------|
| GET    | `/api/summary` | Any  | Aggregate stats: totals, open/resolved by severity |

### Users

| Method | Path                    | Auth       | Description                          |
|--------|-------------------------|------------|--------------------------------------|
| GET    | `/api/users`            | Admin only | List all users (no password hashes)  |
| PUT    | `/api/users/me`         | Any        | Update the authenticated user's username |
| PUT    | `/api/users/:id/role`   | Admin only | Change any user's role               |

### Query parameters for `GET /api/inspections`

| Param       | Type                                  | Description                      |
|-------------|---------------------------------------|----------------------------------|
| `search`    | string                                | Filter by machine line ID        |
| `severity`  | `Critical` \| `Major` \| `Minor`     | Filter by severity               |
| `status`    | `Open` \| `Resolved`                 | Filter by status                 |
| `dateFrom`  | `YYYY-MM-DD`                          | Start of date range              |
| `dateTo`    | `YYYY-MM-DD`                          | End of date range                |
| `sortBy`    | `date` \| `severity` \| `createdAt`  | Sort field                       |
| `sortOrder` | `asc` \| `desc`                       | Sort direction                   |
| `page`      | number                                | Page number (default: 1)         |
| `limit`     | number                                | Results per page (default: 20)   |

---

## Folder Structure

```
quality-inspection-tracker/
├── apps/
│   ├── api/                        # Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── controllers/        # Request handlers (auth, inspections, summary, users)
│   │   │   ├── routes/             # Express route definitions
│   │   │   ├── models/             # Database query functions
│   │   │   ├── db/                 # DB client, migrations, seed data
│   │   │   ├── middleware/         # JWT auth guard, admin-only guard, error handler
│   │   │   └── index.ts            # Server entry point
│   │   └── .env.example
│   │
│   └── web/                        # React 18 + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/             # Shadcn/Radix primitive components
│       │   │   ├── layout/         # AppLayout, ProtectedRoute
│       │   │   └── inspections/    # LogInspectionDialog, ResolveDialog
│       │   ├── constants/          # Shared filter/sort options, date presets
│       │   ├── pages/
│       │   │   ├── admin/          # ManageUsersPage (admin only)
│       │   │   ├── auth/           # LoginPage, RegisterPage
│       │   │   └── ...             # Dashboard, Inspections, Detail, Profile
│       │   ├── store/              # Redux store + slices (auth, inspections, summary)
│       │   ├── services/           # Axios API wrappers (auth, inspections, users)
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

- **Real-time updates via WebSocket** — right now the dashboard refreshes summary stats every 60 seconds via polling. A Socket.io or native WebSocket connection would push defect events to all connected supervisors instantly, which matters when a critical defect is logged on the floor.

- **Photo attachments for defects** — supervisors should be able to attach a photo of the defect at the time of logging. This would require an object-storage integration (S3-compatible) and a `photos` table linked to inspections.

- **Offline-first PWA** — shop floors often have poor Wi-Fi. A service worker with a background sync queue would let supervisors log inspections offline and flush them when connectivity returns.

- **Proper test suite** — the application has no automated tests. I would add Vitest + React Testing Library for component tests, Supertest for API integration tests against a real (in-memory) SQLite instance, and Playwright for critical end-to-end flows (login → log inspection → resolve).

- **PostgreSQL migration for multi-plant scale** — SQLite is perfect for a single embedded deployment, but a larger organisation with multiple plants sharing one API server would need a proper client-server database. The libsql client API is already compatible with Turso (distributed SQLite) or can be swapped for `pg` with minimal model-layer changes.

---

## Assumptions

| Ambiguity | Resolution |
|-----------|------------|
| **Authentication scope** | Only supervisors and admins are modelled. No guest/read-only role was specified, so all routes require a valid JWT. |
| **Delete permissions** | The spec did not define who can delete inspections. Restricted DELETE to the `admin` role to prevent accidental data loss by supervisors. |
| **Defect types** | The list (`Weave Defect`, `Shade Variation`, `Hole/Tear`, `Count Deviation`, `Other`) was inferred from the domain context of textile manufacturing. |
| **Resolution workflow** | Resolving an inspection requires a `resolutionNote`. Enforced on the frontend; the database allows null to keep the schema flexible for bulk imports. |
| **Date storage** | Inspection `date` stores a `YYYY-MM-DD` string (the day the defect was found), while `createdAt`/`updatedAt` are full ISO timestamps. |
| **Pagination default** | API defaults to 20 results per page. The dashboard fetches the 5 most recent for the preview list. |
| **User management** | The spec listed auth as a bonus feature with no detail on user administration. Added self-service username update and an admin-only role management page as practical necessities for a real internal tool. |
