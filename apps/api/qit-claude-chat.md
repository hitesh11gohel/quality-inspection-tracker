Why we use typescript? Also I can't see package.json at root level. How can I push this on github. I want to push it on github with all steps so reviewer can see the progress. show steps to configure it. Later I need deploy it on free servers like render.com so I can send live demo of working project so if they don't have to setup all this then they can access this project via shared link.

Why TypeScript?

Short answer: TypeScript catches bugs at compile time instead of runtime. For this app specifically:

- Shared types (Inspection, SummaryStats, ApiResponse) are defined once in packages/shared and imported in both frontend and backend — if you change a field name, TypeScript immediately flags every broken reference across the whole monorepo
- The dropdown values (DefectType, Severity) are literal union types — a typo like "Criticall" won't compile
- Redux Toolkit, Axios, and React all have excellent TypeScript support so you get autocomplete everywhere
- Reviewers reading your code see intent clearly without needing to trace runtime values

Plain JavaScript would work too, but TypeScript signals to reviewers that you care about maintainability.

---
Why You Don't See root package.json

The prompts tell the AI to create files — but you haven't run the prompts yet. Once you run Prompt 1, it creates all the root files including package.json. If you ran Prompt 1 and the file is missing, paste this follow-up into Claude Code right after:

The root package.json is missing from the monorepo. Create it now with:
- name: quality-inspection-tracker
- private: true
- packageManager: pnpm@9.0.0
- workspaces: ["apps/*", "packages/*"]
- scripts: { "dev": "turbo run dev", "build": "turbo run build", "start": "turbo run start" }
- devDependencies: turbo@latest, typescript@5

Also create pnpm-workspace.yaml:
packages:
  - 'apps/*'
  - 'packages/*'

---
GitHub Setup — Step by Step

Run these commands from inside your project root folder after all prompts are done:

Step 1 — Initialize git locally

git init
git add .
git commit -m "feat: initial monorepo scaffold with shared types"

Step 2 — Create repo on GitHub

Go to https://github.com/new:
- Repository name: quality-inspection-tracker
- Visibility: Public (reviewers need access)
- Do NOT initialize with README (you already have one)
- Click Create repository

Step 3 — Connect and push

git remote add origin https://github.com/YOUR_USERNAME/quality-inspection-tracker.git
git branch -M main
git push -u origin main

Show progress with meaningful commits (do these after each prompt)

# After Prompt 2 (backend)
git add apps/api/
git commit -m "feat(api): Node + Express + SQLite backend with JWT auth"

# After Prompt 3 (frontend setup)
git add apps/web/
git commit -m "feat(web): React + Vite + Shadcn + Redux Toolkit setup"

# After Prompt 4 (Redux store)
git add apps/web/src/store/ apps/web/src/services/
git commit -m "feat(web): Redux store slices and API service layer"

# After Prompt 5 (layout + auth)
git add apps/web/src/
git commit -m "feat(web): app layout, routing, login and register pages"

# After Prompt 6 (core pages)
git add apps/web/src/pages/
git commit -m "feat(web): log inspection form, inspections list, resolve dialog"

# After Prompt 7 (dashboard)
git add apps/web/src/pages/DashboardPage.tsx
git commit -m "feat(web): dashboard with KPI cards and severity breakdown"

# After Prompt 8 (final polish + README)
git add .
git commit -m "docs: README with setup, architecture decisions, and deployment notes"

git push

This gives reviewers a clean commit history showing how you built each layer — exactly what they want to see.

---
Deploy on Render.com — Free Tier

You need two services on Render: one for the API, one for the frontend.

▎ SQLite note: Render's free tier has an ephemeral filesystem — data resets on each redeploy. This is fine for a demo. Add a note in your README: "SQLite data resets on Render free tier redeploys. For persistent demo data, the app seeds a demo user on startup." Your backend already seeds the demo user, so reviewers can always log in.

---
Deploy the Backend (API)

1. Go to https://render.com → New → Web Service
2. Connect your GitHub account and select quality-inspection-tracker
3. Configure:

┌────────────────┬──────────────────────────────┐
│     Field      │            Value             │
├────────────────┼──────────────────────────────┤
│ Name           │ qit-api                      │
├────────────────┼──────────────────────────────┤
│ Root Directory │ apps/api                     │
├────────────────┼──────────────────────────────┤
│ Environment    │ Node                         │
├────────────────┼──────────────────────────────┤
│ Build Command  │ npm install && npm run build │
├────────────────┼──────────────────────────────┤
│ Start Command  │ npm start                    │
├────────────────┼──────────────────────────────┤
│ Instance Type  │ Free                         │
└────────────────┴──────────────────────────────┘

4. Add Environment Variables:

┌─────────────────┬─────────────────────────────────────────────────────────────────────────┐
│       Key       │                                  Value                                  │
├─────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ PORT            │ 3001                                                                    │
├─────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ JWT_SECRET      │ any long random string e.g. qit_super_secret_2025_xyz                   │
├─────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ DB_PATH         │ ./data/qit.db                                                           │
├─────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ NODE_ENV        │ production                                                              │
├─────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ ALLOWED_ORIGINS │ https://qit-web.onrender.com (your frontend URL — set after step below) │
└─────────────────┴─────────────────────────────────────────────────────────────────────────┘

5. Click Create Web Service — Render gives you a URL like https://qit-api.onrender.com

---
Deploy the Frontend (Web)

1. New → Static Site
2. Select the same repo
3. Configure:

┌───────────────────┬──────────────────────────────┐
│       Field       │            Value             │
├───────────────────┼──────────────────────────────┤
│ Name              │ qit-web                      │
├───────────────────┼──────────────────────────────┤
│ Root Directory    │ apps/web                     │
├───────────────────┼──────────────────────────────┤
│ Build Command     │ npm install && npm run build │
├───────────────────┼──────────────────────────────┤
│ Publish Directory │ dist                         │
└───────────────────┴──────────────────────────────┘

4. Add Environment Variables:

┌──────────────┬──────────────────────────────┐
│     Key      │            Value             │
├──────────────┼──────────────────────────────┤
│ VITE_API_URL │ https://qit-api.onrender.com │
└──────────────┴──────────────────────────────┘

5. Click Create Static Site — you get https://qit-web.onrender.com

---
Fix the API proxy for production

After deployment, update apps/web/src/lib/axios.ts so the baseURL reads from the env variable:

// src/lib/axios.ts
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',   // falls back to Vite proxy in dev
});

Then go back to the Render backend service → Environment → update ALLOWED_ORIGINS to your actual frontend URL. Commit and push — Render auto-redeploys.

---
Final checklist before sharing the link

- git push latest code to GitHub
- Both Render services show Live status (green)
- Visit https://qit-web.onrender.com → login works with supervisor / password123
- Add the live demo URL to the top of your README
- Add a Limitations note: "Free Render instances sleep after 15 min inactivity — first load may take 30s to wake up"

The link you share with reviewers is https://qit-web.onrender.com.