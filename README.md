# Emp-management

A small single-admin internal tool for tracking monthly salary payments: add employees,
see who has and hasn't been paid this month, mark salaries as paid, and review each
employee's payment history.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS 4, and Prisma over a local SQLite file.
Project documents (SOW, plan, acceptance criteria, test plan) are in [`docs/`](docs/).

## Quick start

```bash
npm install
cp .env.example .env        # then set SESSION_SECRET (see the file for how)
npm run dev                 # applies migrations and starts http://localhost:3000
```

Sign in with username `eadmin` and password `epassword`.

## What it does

| Screen | Path | Requirements |
| --- | --- | --- |
| Login / logout | `/login` | AUTH-1 – AUTH-5 |
| Monthly view: every employee's paid/unpaid status for the current month, with mark-as-paid | `/monthly` | MON-1 – MON-5, PAY-1 – PAY-5 |
| Employee list and create-only add form | `/employees` | EMP-1 – EMP-6 |
| Per-employee read-only payment history, most recent first | `/employees/:id` | HIST-1 – HIST-4 |

Behaviour decisions (defaults from the project plan's open decisions):

- **Month** = calendar month in the server's timezone, stored as `YYYY-MM`.
- **Payments are recorded for the current month only**; history is view-only.
- The payment amount is always the employee's stored salary; only the payment date is entered,
  and it cannot be in the future.
- Salaries are stored as integer cents, so amounts round-trip exactly.

## How the guarantees are enforced

- **Auth.** Login sets an HTTP-only cookie holding a random session id signed with HMAC-SHA256.
  Middleware rejects unsigned or tampered cookies; every page and server action also checks that
  the session exists in the database, so logging out revokes the cookie even if it is replayed.
- **Immutability.** The data-access modules (`src/server/employees.ts`, `src/server/payments.ts`)
  expose only create and read. SQLite triggers abort any `UPDATE` or `DELETE` on employees and
  payments, and middleware answers `PUT`/`PATCH`/`DELETE` with `405`.
- **Idempotent payments.** A unique `(employeeId, periodMonth)` index means a repeated or concurrent
  mark-as-paid records exactly one payment.

## Project layout

```
prisma/              schema and migrations (incl. immutability triggers)
src/app/             pages, server actions (actions.ts)
src/server/          auth guard and create/read-only data access
src/lib/             validation, month, money, session-token helpers
src/middleware.ts    session and HTTP-method gate
scripts/secure-db.mjs  restricts the SQLite file to the app user
tests/unit, tests/integration   Vitest (integration uses a disposable SQLite file)
e2e/                 Playwright end-to-end, security and accessibility checks
docs/OPERATIONS.md   deployment, permissions, backup/restore, data correction
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Migrate and run the dev server |
| `npm run build` / `npm start` | Production build / migrate, secure DB, and serve |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit and integration tests |
| `npm run test:e2e` | Playwright suite (builds and serves the app on port 3100 with its own database; run `npx playwright install chromium` once first) |
| `npm run db:secure` | Re-apply owner-only permissions to the database file |

## Deployment

See [`docs/OPERATIONS.md`](docs/OPERATIONS.md). In short: run it on one host, reachable only from a
trusted local network (the admin credentials are fixed), with a unique `SESSION_SECRET` and
daily backups of the SQLite file.

## Pull requests

PRs into `main` merge automatically (squash) once CodeRabbit has approved and the required
`checks` and `e2e` jobs pass. If CodeRabbit requests changes, push a fix and resolve its
comment threads; it re-reviews and approves. Draft PRs and PRs from forks are not auto-merged.
