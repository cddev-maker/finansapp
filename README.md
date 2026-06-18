# FinansApp — Production SaaS Personal Finance Manager

Full-stack personal finance management application built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Prisma**, and **PostgreSQL (Supabase)**.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![NextAuth](https://img.shields.io/badge/NextAuth.js-4-purple)

## Features

- **Authentication** — Email/password via NextAuth.js, bcrypt hashing, password reset flow, protected routes via middleware
- **Dashboard** — KPIs, income/expense charts, category breakdown, balance trend, budget alerts, upcoming/overdue payment widgets, end-of-month forecast
- **Transactions** — Full CRUD, TanStack Table with sorting/filtering/pagination, CSV import/export
- **Payments** — Recurring payment tracking, completion checkbox, auto status (Pending/Paid/Overdue/Cancelled), 7/3/0-day email reminders via cron
- **Credit Cards** — Multiple cards, limit tracking, utilization %, statement/due dates
- **Budgets** — Category-specific monthly/yearly budgets, utilization %, overspending alerts
- **Reports** — 12-month forecast, savings analysis, category breakdown, PDF export (monthly & yearly)
- **Data Backup** — Full JSON export/import of all account data
- **Dark mode**, **Turkish locale (₺, tr-TR)**, **toast notifications**, **undo delete**, **WCAG-accessible Radix components**

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript 5.6 (strict mode) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 5.22 |
| Auth | NextAuth.js v4 (Credentials provider) |
| State | Zustand (UI) + TanStack Query (server state) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Email | Nodemailer |
| Icons | Lucide React |

## Project Structure

```
finansapp/
├── prisma/
│   ├── schema.prisma              # Full normalized schema
│   ├── seed.ts                    # Demo data seeder
│   └── migrations/
│       └── 0001_init/migration.sql
├── src/
│   ├── middleware.ts               # Route protection
│   ├── app/
│   │   ├── (auth)/                 # Public auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/            # Protected app pages
│   │   │   ├── layout.tsx          # Sidebar + header shell
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── credit-cards/page.tsx
│   │   │   ├── budgets/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── backup/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── auth/forgot-password/route.ts
│   │       ├── auth/reset-password/route.ts
│   │       ├── transactions/route.ts + [id]/route.ts
│   │       ├── payments/route.ts + [id]/route.ts
│   │       ├── credit-cards/route.ts + [id]/route.ts
│   │       ├── budgets/route.ts + [id]/route.ts
│   │       ├── reports/route.ts
│   │       ├── backup/route.ts
│   │       ├── settings/route.ts
│   │       └── cron/payment-reminders/route.ts
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── layout/                 # AppSidebar, AppHeader
│   │   ├── transactions/, payments/, credit-cards/, budgets/
│   ├── hooks/                      # React Query + Zustand hooks
│   ├── lib/                        # prisma, auth, email, pdf, utils, validations
│   ├── types/                      # Domain types + NextAuth augmentation
│   └── constants/                  # Categories, labels, colors
├── vercel.json                     # Cron job config
└── .github/workflows/ci.yml
```

## Database Schema (key models)

```prisma
model User           { id, email, password (bcrypt), role, … }
model Transaction     { date, description, category, amount, type, creditCardId, … }
model Payment         { name, amount, dueDate, startDate, endDate, status, completed, reminderSentAt, … }
model CreditCard      { name, lastFourDigits, creditLimit, currentBalance, statementDate, dueDate, … }
model CardStatement   { creditCardId, periodStart, periodEnd, statementAmount, minimumPayment, … }
model Budget          { category, amount, period, year, month, alertAt, … }
model AuditLog        { userId, action, entityType, entityId, metadata, … }
```

All tables include `createdAt` / `updatedAt` audit fields. Indexes are tuned for: historical date-range queries (`userId, date`), monthly reporting (`userId, date, type`), payment forecasting (`userId, completed, dueDate`), and calendar lookups (`userId, dueDate`).

Every query in every API route is scoped with `where: { userId }` — there is no code path that can return another user's records.

## Installation

```bash
git clone <your-repo-url>
cd finansapp
npm install

cp .env.example .env
# Edit .env: set DATABASE_URL + DIRECT_URL (see Supabase section below)

npm run db:generate
npm run db:migrate        # applies prisma/migrations/0001_init
npm run db:seed           # demo user: demo@finansapp.dev / Demo1234!

npm run dev
```

Visit `http://localhost:3000` → redirected to `/login` → sign in with the demo account.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase pooled connection (PgBouncer, port 6543) |
| `DIRECT_URL` | ✅ | Supabase direct connection (port 5432), used by migrations |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | App base URL |
| `EMAIL_SERVER_HOST/PORT/USER/PASSWORD` | For reminders | SMTP credentials |
| `EMAIL_FROM` | For reminders | Sender address |
| `CRON_SECRET` | ✅ | `openssl rand -hex 32`, secures the cron endpoint |
| `NEXT_PUBLIC_APP_URL` | ✅ | Used in email templates |

## Deployment — Vercel + Supabase

### 1. Create Supabase project
1. [supabase.com](https://supabase.com) → New Project
2. Project Settings → Database → copy **Connection string (URI)** → this is `DIRECT_URL` (port 5432)
3. Copy **Connection pooling** string → this is `DATABASE_URL` (port 6543, `?pgbouncer=true`)

### 2. Run migrations against Supabase
```bash
DATABASE_URL="<pooled-url>" DIRECT_URL="<direct-url>" npx prisma migrate deploy
DATABASE_URL="<pooled-url>" DIRECT_URL="<direct-url>" npx tsx prisma/seed.ts   # optional demo data
```

### 3. Deploy to Vercel
```bash
npm i -g vercel
vercel
```
In the Vercel dashboard → Project → Settings → Environment Variables, add all variables from `.env.example` (production values). Redeploy.

### 4. Cron job
`vercel.json` already declares:
```json
{ "crons": [{ "path": "/api/cron/payment-reminders", "schedule": "0 9 * * *" }] }
```
Vercel automatically registers this on deploy (Pro plan or higher for cron). The endpoint checks `Authorization: Bearer $CRON_SECRET` — Vercel injects this header automatically when `CRON_SECRET` is set as an env var.

## Available Scripts

```bash
npm run dev               # http://localhost:3000
npm run build / start     # production build/run
npm run lint / typecheck
npm run db:generate
npm run db:migrate        # dev migrations
npm run db:migrate:deploy # production migrations
npm run db:seed
npm run db:studio
npm run db:reset
```

## Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- All API routes wrapped in `withAuth()` — throws `UNAUTHORIZED` → 401 if no session
- Every Prisma query scoped by `userId`; `updateMany`/`deleteMany` with `{ id, userId }` compound where-clause prevents cross-user writes even with a guessed ID
- Zod validation on every mutating endpoint, both client and server side
- `middleware.ts` redirects unauthenticated requests away from all `(dashboard)` routes
- Cron endpoint requires a bearer secret; not reachable without `CRON_SECRET`
- Audit log records create/update/delete actions with IP + user agent

## License

MIT
