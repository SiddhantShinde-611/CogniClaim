# CogniClaim

**AI-assisted expense reimbursement management platform**

CogniClaim streamlines corporate expense workflows with AI-powered receipt extraction, multi-step approval engines, real-time currency conversion, and comprehensive audit trails.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + custom shadcn-style components |
| State | Zustand + TanStack Query v5 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 + Prisma ORM |
| Auth | JWT (15min) + Refresh Token (7d) + bcrypt |
| AI/OCR | Claude claude-sonnet-4-5-20251001 (vision) |
| Currency | restcountries.com + exchangerate-api.com |
| PWA | Vite PWA Plugin + Workbox |

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15
- Anthropic API key
- ExchangeRate API key (free at exchangerate-api.com)

### 1. Clone and install dependencies

```bash
# Backend
cd cogniclaim/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# Backend
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, REFRESH_TOKEN_SECRET,
#          ANTHROPIC_API_KEY, EXCHANGE_RATE_API_KEY

# Frontend
cp .env.example .env
# Fill in: VITE_API_URL (default: http://localhost:3001)
```

### 3. Set up the database

```bash
cd backend
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
```

### 4. Start development servers

```bash
# Backend (port 3001)
cd backend
npm run dev

# Frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173 and create your first company account.

---

## Project Structure

```
cogniclaim/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth + role guards
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic (OCR, currency, approvals)
│   │   └── index.ts         # Express app entry point
│   └── prisma/
│       └── schema.prisma    # Database schema
└── frontend/
    └── src/
        ├── components/      # Reusable UI components
        │   ├── ui/          # Base components (Button, Card, Input...)
        │   ├── layout/      # Sidebar, Navbar
        │   ├── expense/     # Expense-specific components
        │   ├── approval/    # Approval queue + rule builder
        │   └── audit/       # Audit timeline
        ├── pages/           # Route pages by role
        ├── hooks/           # TanStack Query hooks
        ├── stores/          # Zustand auth store
        ├── lib/             # API client, utils, IndexedDB
        └── types/           # TypeScript interfaces
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **ADMIN** | Full access: manage users, configure approval policies, view all expenses + audit trails |
| **MANAGER** | Approve/reject expenses assigned to them in approval workflows |
| **EMPLOYEE** | Submit expenses, track personal expense history |

---

## Key Features

### AI Receipt OCR
Upload a receipt image (JPEG/PNG/WebP) on the Submit Expense page. Claude AI extracts:
- Amount and currency
- Date and merchant name
- Category and description
- Confidence flags (low-confidence fields highlighted in yellow)

### Approval Engine
Supports four workflow types:
- **Sequential**: All steps must approve in order
- **Percentage**: Auto-approve when X% of approvers have approved
- **Specific**: Auto-approve when a named approver approves
- **Hybrid**: Either the percentage threshold OR the specific approver

### Currency Conversion
- Auto-detects company base currency from country (via restcountries API)
- Live exchange rates cached 1 hour (via exchangerate-api.com)
- Preview conversion while filling out expense form

### PWA + Offline Support
- Service worker caches key routes
- IndexedDB stores expense drafts when offline
- Auto-submits pending drafts when connection restored

### Audit Trail
Every action (submit, approve, reject) is logged with actor, timestamp, IP address, and metadata. Admins can view the full timeline per expense.

---

## API Endpoints

### Auth
- `POST /api/auth/signup` — Create company + admin account
- `POST /api/auth/login` — Login, returns JWT + refresh token
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Invalidate refresh token

### Expenses
- `POST /api/expenses` — Submit expense
- `GET /api/expenses/me` — My expense history
- `GET /api/expenses/pending` — Team pending (Manager+)
- `GET /api/expenses` — All expenses with filters (Admin)
- `PATCH /api/expenses/:id/approve` — Approve
- `PATCH /api/expenses/:id/reject` — Reject (requires comment)
- `POST /api/expenses/ocr` — Extract receipt data via AI
- `GET /api/expenses/:id/audit` — Full audit trail (Admin)

### Users (Admin)
- `GET /api/users` — List company users
- `POST /api/users` — Create user
- `PATCH /api/users/:id/role` — Update role
- `PATCH /api/users/:id/manager` — Assign manager

### Policies (Admin)
- `POST /api/approvals/policies` — Create approval policy
- `GET /api/approvals/policies` — List policies

### Currencies
- `GET /api/currencies?base=USD` — Get exchange rates

---

## Environment Variables

### Backend (`.env`)

```
DATABASE_URL=postgresql://user:password@localhost:5432/cogniclaim
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
ANTHROPIC_API_KEY=sk-ant-...
EXCHANGE_RATE_API_KEY=your-key
PORT=3001
```

### Frontend (`.env`)

```
VITE_API_URL=http://localhost:3001
```

---

## Color Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6C3FC5` | Buttons, links, active states |
| Accent | `#D4A017` | Warnings, low-confidence highlights |
| Success | `#1E8449` | Approved states |
| Danger | `#C0392B` | Rejected states, errors |
| Surface | `#F4F6FB` | Page backgrounds, cards |
| Text | `#1A1A2E` | Primary text |

---

## Production Deployment

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

For production, ensure:
- Use strong random secrets for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- Set `DATABASE_URL` to your production PostgreSQL instance
- Update CORS origins in `backend/src/index.ts`
- Configure your reverse proxy to serve the frontend build
