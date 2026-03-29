# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CogniClaim is a full-stack expense management SaaS with AI-powered OCR (Claude vision), multi-level approval workflows, currency conversion, and PWA/offline support. It's a monorepo with separate `backend/` and `frontend/` directories.

## Development Commands

### Backend (port 3001)
```bash
cd backend
npm run dev          # Hot reload via tsx watch
npm run build        # Compile TypeScript to dist/
npm start            # Run production build
npm run db:generate  # Generate Prisma client (required after schema changes)
npm run db:push      # Push schema to database (dev, no migration history)
npm run db:migrate   # Run migrations (production-safe)
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed sample data
```

### Frontend (port 5173)
```bash
cd frontend
npm run dev          # Vite dev server
npm run build        # TypeScript check + production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
```

## Environment Variables

**Backend** (`.env`):
- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL connection strings
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET` — Token signing keys
- `ANTHROPIC_API_KEY` — Claude API for receipt OCR
- `EXCHANGE_RATE_API_KEY` — Currency exchange rates
- `PORT` — Defaults to 3001
- `RENDER_EXTERNAL_URL` — Required for keep-alive ping on Render

**Frontend** (`.env`):
- `VITE_API_URL` — Backend URL (default: `http://localhost:3001`)

## Architecture

### Backend (`backend/src/`)
- **Entry:** `index.ts` — Express setup, CORS, route mounting, keep-alive ping
- **Controllers:** `auth`, `expense`, `approval`, `user`, `currency`
- **Routes:** Mounted at `/api/{auth,expenses,approvals,users,currencies}`
- **Middleware:** `auth.middleware.ts` (JWT verification), `role.middleware.ts` (RBAC)
- **Services:** `ocr.service.ts` (Claude vision), `approval.service.ts` (workflow logic), `currency.service.ts` (exchange rates with 1hr DB cache)
- **Database:** Prisma ORM → PostgreSQL. Schema at `prisma/schema.prisma`

**Auth flow:** Access token (JWT, 15min) + Refresh token (7d) stored in DB. Frontend auto-refreshes on 401.

### Frontend (`frontend/src/`)
- **Router:** `App.tsx` — React Router v6 with role-based route protection
- **State:** Zustand (`stores/authStore.ts`) for auth; TanStack Query for all server data
- **API client:** `lib/api.ts` — Axios instance with auto-refresh interceptor on 401
- **Offline:** `lib/idb.ts` — IndexedDB for draft expense storage; Service Worker (Workbox) for caching
- **Pages:** `pages/auth/`, `pages/employee/`, `pages/manager/`, `pages/admin/`
- **Components:** `components/ui/` (base), `components/expense/`, `components/approval/`, `components/audit/`

### Database Models
`Company` → `User` (roles: ADMIN/MANAGER/EMPLOYEE) → `Expense` → `ApprovalRequest` → `AuditLog`

`ApprovalPolicy` defines workflow type: SEQUENTIAL (ordered steps), PERCENTAGE (threshold), SPECIFIC (named approver), HYBRID (percentage OR specific).

### Role Access
- **ADMIN:** Full access — users, policies, all expenses, audit logs
- **MANAGER:** Approve/reject assigned expenses
- **EMPLOYEE:** Submit and view own expenses

### AI OCR
Uses `claude-sonnet-4-5` vision model. The `ocr.service.ts` sends base64-encoded receipt images and extracts amount, currency, date, merchant, category, and description with confidence flags. Low-confidence fields are highlighted in the UI.

## Deployment

- **Backend:** Render.com — build: `npm install --include=dev && npx prisma generate && npm run build`, start: `npm start`
- **Frontend:** Vercel — `vercel.json` rewrites all routes to `index.html`
- CORS is configured for `localhost:5173`, `localhost:4173`, `cogniclaim-app.vercel.app`, and `*.vercel.app` subdomains
