# Test Plan

Employee Management

QA strategy for Employee Management, a single-admin internal Next.js/SQLite salary-tracking tool. Testing centers on the three real risk areas the TDD flags: server-side authorization behind hardcoded credentials, immutability of employee records and payments, and idempotent per-employee-per-month payment recording backed by a unique DB constraint. Because scale is tiny and there are no external integrations, the suite prioritizes correctness of the data model, session enforcement, and month-boundary/idempotency logic over performance or load.

## Strategy

The product is a modular monolith with one admin, one local SQLite file, and no external services, so the strategy concentrates effort where the TDD says risk actually lives rather than spreading it thin. First, authorization: every mutating route/server action must be tested to reject requests without a valid signed HTTP-only session cookie, not just hidden in the UI — integration tests hit API routes directly with no cookie, a tampered cookie, and a valid cookie to prove the server is the gate (AUTH-2, AUTH-3). Because credentials are hardcoded and permanent, we do not test rotation/lockout (out of design) but we do verify the non-specific failure message (AUTH-5) and that the exact pair eadmin/epassword is the only accepted credential (AUTH-1). Second, immutability and the create-only domain: tests must confirm there is no UI or API path to edit or delete an employee or a payment, and that stored salary equals entered salary and cannot change (EMP-3, EMP-4, EMP-5, HIST-3) — this is asserted at the data-access layer, not only the UI, since the TDD makes immutability a data-layer guarantee. Third, idempotent payments: the unique (employeeId, periodMonth) constraint is the reliability backbone, so integration tests fire concurrent/duplicate mark-as-paid requests and assert at most one Payment row with correct employee reference, month, amount and payment date (PAY-3, PAY-4). Month definition (calendar month, server timezone) is an open technical question flagged by the TDD; tests must pin the resolved behavior for current-month computation and month-boundary edge cases, and the payment flow is validated against whichever answer is confirmed (current-month-only vs. arbitrary past month). Unit tests cover validation (positive numeric salary, required fields, EMP-2) and status computation. E2E covers the operator's real path: log in, add employee, view monthly list, mark paid, view history. Manual effort is deliberately small: accessibility judgment on the simple forms/status indicators, exploratory testing of the immutability guarantees and error messaging, and a manual verification of restricted SQLite filesystem permissions and backup guidance at launch. Automation is the default for auth, data-model, validation and idempotency; manual is reserved only for judgment and host-level checks that cannot be meaningfully automated in CI.

## Scope

**In scope**

- Hardcoded single-admin login accepting only eadmin/epassword and rejecting all else (AUTH-1)
- Signed HTTP-only session cookie establishment, logout clearing, and route protection with redirect to login (AUTH-2, AUTH-3, AUTH-4)
- Non-specific failed-login error messaging (AUTH-5)
- Server-side authorization on every mutating route/action independent of the UI
- Create-only employee creation with name, designation, DOB, positive numeric salary and validation (EMP-1, EMP-2)
- Enforced immutability: no edit or delete path for employees, fixed salary (EMP-3, EMP-4, EMP-5)
- Employee list display (EMP-6)
- Current-month monthly view with paid/unpaid status and visual distinction, no totals (MON-1, MON-2, MON-5)
- Mark-as-paid action and immediate status update (MON-3, MON-4)
- Payment recording with prefilled salary, required payment date, idempotent per employee/month, durable persistence, no method/notes (PAY-1 to PAY-5)
- Per-employee read-only payment history with month/amount/date and recent-first ordering (HIST-1 to HIST-4)
- Unique (employeeId, periodMonth) constraint behavior under duplicate/concurrent marking
- Month computation and boundary behavior once the open month-navigation question is resolved
- SQLite file permission restriction and backup guidance verification at launch

**Out of scope**

- Credential rotation, password reset, account lockout, multi-user or role-based access (single hardcoded admin by design)
- Employee logins and self-service
- Timesheets, attendance, leave tracking
- Editing/deleting employee records or salary revision history
- Totals or aggregate summary metrics on the monthly view
- Payment method or notes fields
- Load, stress, and horizontal-scale testing (scale is intentionally single-user)
- External integration testing (there are none)
- Multi-machine/clustering, high-availability, and failover testing
- Penetration testing of network exposure (deployment isolation is an operational decision, not app scope)

## Test levels

| Level | Purpose | Tooling | Owner | Automation |
| --- | --- | --- | --- | --- |
| unit | Validate pure logic: field/salary validation (positive numeric, required fields), current-month computation and boundary handling, paid/unpaid status derivation, and data-access rules enforcing create-only/fixed-salary. | Vitest (or Jest) with TypeScript | Senior engineer reviewing AI-drafted tests | Fully automated in CI on every push |
| integration | Exercise Next.js API routes/server actions against a real SQLite test database: session enforcement on mutating routes, credential check, employee persistence, idempotent payment writes against the unique (employeeId, periodMonth) constraint, and absence of any edit/delete endpoints. | Vitest + Prisma against an ephemeral SQLite file; direct route/handler invocation and HTTP-level assertions | Senior engineer | Fully automated in CI with per-run isolated SQLite fixture |
| e2e | Validate the admin's real end-to-end journey through the UI: login, add employee, view monthly list, mark paid with prefilled salary and payment date, status update without reload issues, and view payment history read-only. | Playwright against a running app instance with a seeded SQLite file | Senior engineer | Automated; run in CI and before each release |
| security | Confirm server-side authorization cannot be bypassed via the UI: unauthenticated/tampered-cookie access to protected pages and mutating actions is rejected, cookie is HTTP-only and signed, and login errors do not leak which field failed. Verify restricted SQLite filesystem permissions on the host. | Playwright/API scripts for auth-bypass checks; manual host inspection for file permissions | Senior engineer | Auth-bypass checks automated; filesystem-permission verification manual at launch |
| accessibility | Judge keyboard operability, form labeling, and clarity of the paid/unpaid visual distinction (not relying on color alone) on the login, employee, monthly, and history screens. | axe-core automated scan plus manual keyboard/screen-reader spot checks | Senior engineer | Automated axe scan in CI; manual judgment pass once per screen |
| manual | Exploratory testing of immutability guarantees, error messaging, month-boundary edge cases, and launch-time checks (backup guidance, file permissions) that require human judgment or host access. | Manual session with documented charters | Senior engineer / product owner for acceptance | Manual, once per sprint and at launch |

## Environments

| Environment | Purpose | Data |
| --- | --- | --- |
| Local/CI test | Unit and integration runs with an isolated, disposable SQLite file per test run; no shared state. | Programmatically seeded fixtures created and torn down per run; no real data. |
| Staging (single host) | E2E, accessibility, and pre-launch acceptance against a running Next.js instance mirroring the single-host production setup. | Seeded synthetic employees and payments spanning multiple months to exercise history and month boundaries. |
| Production (single host) | The live single always-on host with the local SQLite file the admin uses; verify file permissions and backup guidance only. | Real operator data; no test writes — verification limited to smoke and permission checks. |

## Test data

- Use fully synthetic employees and payments; no PII beyond fabricated names, designations, and DOBs.
- Seed multi-month payment history to test HIST ordering and per-employee history, and to exercise month-boundary logic.
- Create at least one employee with an existing current-month payment to test idempotent duplicate-marking against the unique constraint.
- Isolate each integration test run with its own ephemeral SQLite file to avoid cross-test contamination and to reflect single-file locality.
- Never run automated writes against the production SQLite file; production checks are read-only smoke and filesystem inspection.
- Include boundary salary values (e.g., zero, negative, non-numeric, fractional) to validate positive-numeric salary enforcement.
- Cover date edge cases around month rollover using the server-timezone month definition once confirmed.

## Entry criteria

- Approved TDD and numbered functional requirements are baselined for the sprint scope.
- Open question on month navigation (current-month-only vs. arbitrary past month) is resolved before the payment-recording test cases are drafted.
- Prisma schema and initial migration for Employee and Payment are in place with the unique (employeeId, periodMonth) constraint.
- CI can spin up an isolated SQLite test database and run the app for E2E.
- Feature under test is code-complete and deployed to the local/CI or staging environment.

## Exit criteria

- All Must requirements (AUTH-1/2/3, EMP-1..5, MON-1..4, PAY-1..4, HIST-1..3) have passing automated coverage.
- No open Critical or High defects; server-side authorization bypass and duplicate-payment defects are zero.
- Idempotency verified: duplicate/concurrent mark-as-paid produces exactly one Payment row.
- Immutability verified: no reachable UI or API path edits or deletes an employee or payment.
- Accessibility scan shows no critical violations and paid/unpaid status is distinguishable without color alone.
- At launch: SQLite file permissions restricted and backup guidance documented and verified.
- Product owner has signed off against the acceptance criteria in the TDD.

## Defect management

Defects are logged in the team tracker with severity, the affected requirement ID (e.g. PAY-3), reproduction steps, and environment. Severity is weighted to this product's real risks: any authorization bypass on a mutating route, any path that edits/deletes immutable records, or any duplicate payment breaking the unique-constraint guarantee is Critical and blocks release. Validation gaps, incorrect month/status computation, and history-ordering errors are High. Cosmetic UI and non-blocking accessibility findings are Medium/Low. AI agents draft fixes and regression tests; a senior engineer reviews and owns closure, confirming the failing test now passes before the defect is closed. Because there is no in-app correction path for immutable data, any defect that could corrupt persisted employee or payment records is treated as release-blocking regardless of frequency.

## Risk areas

| Area | Risk | Mitigation |
| --- | --- | --- |
| Authentication & authorization | Hardcoded permanent credentials mean the app's only protection is server-side session enforcement; a mutating route that trusts the UI or accepts a missing/forged cookie exposes all data. | Integration and security tests hit every mutating route directly with no cookie, a tampered cookie, and a valid cookie; assert HTTP-only signed cookie and redirect-to-login for unauthenticated access. Verify deployment isolation guidance is documented at launch. |
| Data durability (single SQLite file) | All state lives in one local file with no built-in backup; corruption or disk loss means total data loss and there is no in-app way to re-enter immutable records. | Verify restricted filesystem permissions and that written backup/export guidance exists before launch; test durable writes and constraint enforcement so recorded payments are not silently lost. |
| Payment idempotency & month boundaries | Ambiguous month navigation and timezone-dependent month computation could allow duplicate payments or misassigned months, undermining the core paid/unpaid value. | Resolve the month-navigation open question before drafting PAY cases; test concurrent/duplicate mark-as-paid against the unique constraint and pin month-boundary behavior with server-timezone edge-case data. |
| Immutability with no correction path | Create-only employees and no payment edits mean any data-entry mistake requires direct DB intervention; a bug that persists wrong data is unrecoverable in-app. | Assert immutability at the data-access layer and API, validate all inputs (positive numeric salary, required fields) strictly at creation, and treat record-corruption defects as release-blocking. |
| Status display correctness | Paid/unpaid distinction relying on color alone or a stale status after marking paid would mislead the operator about who has been paid. | E2E tests assert immediate status update after marking paid; accessibility checks confirm status is conveyed beyond color. |

## Sprint gates

### Sprint 1 — Foundations, single-admin auth, employee creation, and the current-month monthly view with mark-as-paid. Heaviest testing on server-side authorization, create-only/immutable employee data, input validation, and idempotent current-month payment recording against the unique constraint.

**Entry**

- Prisma schema and initial migration for Employee and Payment (with unique (employeeId, periodMonth)) merged.
- Month-definition/navigation open question resolved sufficiently to test current-month computation.
- CI can provision an isolated SQLite test DB and launch the app for E2E.

**Exit**

- AUTH-1/2/3 and AUTH-5 have passing automated coverage; unauthenticated access to protected pages and mutating routes is rejected.
- EMP-1/2/3/4/5 verified: employees created with validation, no edit/delete path, salary fixed.
- MON-1/2/3/4 verified: monthly list shows accurate current-month status, distinguishes paid/unpaid, and updates immediately after marking paid.
- PAY-1/2/3/4 verified: salary prefilled, payment date required, at most one payment per employee/month, correct persistence.
- No open Critical/High defects in auth, immutability, or idempotency.

### Sprint 2 — Per-employee payment history plus hardening and launch. Testing on read-only history correctness and ordering, edge-case handling, and launch-time verification of file permissions and backup guidance.

**Entry**

- Sprint 1 exit criteria met with no carried-over Critical/High defects.
- Payment history feature code-complete and deployed to staging with multi-month seeded data.
- Target single host prepared for launch verification.

**Exit**

- HIST-1/2/3/4 verified: history lists all payments with month/amount/date, is read-only, and orders recent months first.
- AUTH-4 (logout) and remaining Should requirements (EMP-6, MON-5, PAY-5) verified.
- Full acceptance run against TDD acceptance criteria passes with product-owner sign-off.
- SQLite filesystem permissions restricted and backup/export guidance documented and confirmed.
- Accessibility scan clean of critical issues; no open Critical/High defects; release approved.


## Test cases

48 case(s).

### Sprint 1

#### TC-001 — Application starts and connects to SQLite database

`integration` · `high` · Requirements: EMP-1, PAY-4 · Stories: emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas

**Preconditions**

- Application built from clean checkout
- No pre-existing database file

**Steps**

1. Run the initial migration against an empty database
2. Start the application locally
3. Query the database for the Employee and Payment tables

**Expected:** Migration applies cleanly, application starts without error, and both Employee and Payment tables exist with expected columns

#### TC-002 — Employee and Payment table schema stores required columns

`integration` · `high` · Requirements: EMP-1, PAY-4 · Stories: emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas

**Preconditions**

- Migrated empty database

**Steps**

1. Inspect Employee table columns
2. Inspect Payment table columns

**Expected:** Employee table has name, designation, date of birth, salary; Payment table has employee reference, month, salary amount, and payment date

#### TC-003 — Unique constraint prevents duplicate payment per employee per month at DB level

`integration` · `high` · `negative` · Requirements: PAY-3 · Stories: emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas

**Preconditions**

- Migrated database with one employee

**Steps**

1. Insert a Payment row for employeeId=1, periodMonth=current
2. Attempt to insert a second Payment row for employeeId=1, same periodMonth directly at the data layer

**Expected:** Second insert is rejected by the unique (employeeId, periodMonth) constraint; only one row exists

#### TC-004 — Login succeeds with exact credentials eadmin/epassword

`integration` · `high` · Requirements: AUTH-1, AUTH-2 · Stories: auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a

**Preconditions**

- Application running

**Steps**

1. POST to login route with username 'eadmin' and password 'epassword'
2. Inspect the response and Set-Cookie header

**Expected:** Login is accepted and a signed HTTP-only session cookie is set in the response

#### TC-005 — Session cookie is signed and HTTP-only

`security` · `high` · Requirements: AUTH-2 · Stories: auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a

**Preconditions**

- Successful login performed

**Steps**

1. Examine the Set-Cookie header attributes
2. Attempt to read the cookie value via document.cookie in the browser

**Expected:** Cookie carries HttpOnly attribute, is signed, and is not accessible from client-side JavaScript

#### TC-006 — Login rejected with wrong password

`integration` · `high` · `negative` · Requirements: AUTH-1, AUTH-5 · Stories: auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a

**Preconditions**

- Application running

**Steps**

1. POST to login route with username 'eadmin' and password 'wrong'
2. Inspect response body and Set-Cookie header

**Expected:** Login rejected, no session cookie set, and error message is non-specific (does not indicate which field was wrong)

#### TC-007 — Login rejected with wrong username

`integration` · `high` · `negative` · Requirements: AUTH-1, AUTH-5 · Stories: auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a

**Preconditions**

- Application running

**Steps**

1. POST to login route with username 'admin' and password 'epassword'
2. Inspect response body

**Expected:** Login rejected, no session cookie set, and same non-specific error message is shown

#### TC-008 — Non-specific error message is identical across failure types

`unit` · `medium` · `negative` · Requirements: AUTH-5 · Stories: auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a

**Preconditions**

- Auth handler available

**Steps**

1. Invoke auth with wrong username
2. Invoke auth with wrong password
3. Compare returned error messages

**Expected:** Both failures return the same generic error text with no indication of which field failed

#### TC-009 — Unauthenticated request to protected page redirects to login

`integration` · `high` · `negative` · Requirements: AUTH-3 · Stories: auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha

**Preconditions**

- Application running, no session cookie held

**Steps**

1. Request a protected page (e.g. monthly view) with no cookie
2. Observe response

**Expected:** Request is redirected to the login screen

#### TC-010 — Mutating action rejected without valid session cookie

`integration` · `high` · `negative` · Requirements: AUTH-3, AUTH-2 · Stories: auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha

**Preconditions**

- Application running

**Steps**

1. POST to the add-employee action with no cookie
2. POST to the mark-as-paid action with no cookie

**Expected:** Both requests are rejected/redirected to login and no data is created

#### TC-011 — Mutating action rejected with tampered session cookie

`security` · `high` · `negative` · Requirements: AUTH-3, AUTH-2 · Stories: auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha

**Preconditions**

- A valid signed cookie captured then modified

**Steps**

1. Alter the signature/payload of a valid session cookie
2. POST to a mutating action with the tampered cookie

**Expected:** Server rejects the tampered cookie and redirects to login; no mutation occurs

#### TC-012 — Logout clears session cookie and returns to login

`integration` · `high` · Requirements: AUTH-4 · Stories: auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha

**Preconditions**

- Logged-in session

**Steps**

1. Invoke the logout action
2. Inspect Set-Cookie header and response redirect

**Expected:** Session cookie is cleared/expired and user is returned to the login screen

#### TC-013 — Protected routes inaccessible after logout until re-login

`integration` · `high` · `negative` · Requirements: AUTH-3, AUTH-4 · Stories: auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha

**Preconditions**

- Logged in then logged out

**Steps**

1. After logout, request a protected page using the old cookie
2. Observe response

**Expected:** Access is denied and user is redirected to login

#### TC-014 — Create employee with valid data persists and appears in list

`e2e` · `high` · Requirements: EMP-1, EMP-6 · Stories: emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl

**Preconditions**

- Logged-in admin

**Steps**

1. Open the add-employee form
2. Enter name, designation, date of birth, and a positive salary
3. Submit the form
4. View the employee list

**Expected:** Employee is saved and appears in the employee list with the entered details

#### TC-015 — Stored salary matches entered value

`integration` · `high` · Requirements: EMP-1, EMP-5 · Stories: emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl

**Preconditions**

- Logged-in admin

**Steps**

1. Create an employee with salary 5000
2. Query the Employee record in the database

**Expected:** Stored salary equals 5000 exactly

#### TC-016 — Employee creation validation rejects missing fields

`unit` · `high` · `negative` · Requirements: EMP-2 · Stories: emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl

**Preconditions**

- Validation logic available

**Steps**

1. Submit employee data with an empty name
2. Submit with empty designation
3. Submit with missing date of birth

**Expected:** Each submission is rejected with a validation error and no record is created

#### TC-017 — Employee creation validation rejects non-positive/non-numeric salary

`unit` · `high` · `negative` · Requirements: EMP-2 · Stories: emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl

**Preconditions**

- Validation logic available

**Steps**

1. Submit salary of 0
2. Submit salary of -100
3. Submit salary of 'abc'

**Expected:** Each submission is rejected with a validation error and no record is created

#### TC-018 — No API or UI path exists to edit an employee

`integration` · `high` · `negative` · Requirements: EMP-3, EMP-5 · Stories: emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte

**Preconditions**

- Logged-in admin, one existing employee

**Steps**

1. Enumerate available routes/actions for the employee resource
2. Attempt an update/PUT/PATCH request against the employee id with modified salary

**Expected:** No edit route exists; any update attempt is rejected and the stored employee record (including salary) is unchanged

#### TC-019 — No API or UI path exists to delete an employee

`integration` · `high` · `negative` · Requirements: EMP-4 · Stories: emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte

**Preconditions**

- Logged-in admin, one existing employee

**Steps**

1. Enumerate available routes/actions for the employee resource
2. Attempt a DELETE request against the employee id

**Expected:** No delete route exists; delete attempt is rejected and the employee record remains

#### TC-020 — Data-access layer does not expose employee mutation methods

`unit` · `high` · Requirements: EMP-3, EMP-4, EMP-5 · Stories: emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte

**Preconditions**

- Data-access layer available

**Steps**

1. Inspect the employee repository/data-access module
2. Confirm only create and read operations are provided

**Expected:** No update or delete methods for employees exist at the data-access layer

#### TC-021 — Monthly view lists every employee with accurate status

`e2e` · `high` · Requirements: MON-1 · Stories: mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th

**Preconditions**

- Logged-in admin
- Two employees exist, one already paid for current month

**Steps**

1. Open the monthly payment view
2. Review the listed employees and their status indicators

**Expected:** All employees appear; the paid employee shows paid and the other shows unpaid for the current month

#### TC-022 — Paid/unpaid status computation for current month

`unit` · `high` · Requirements: MON-1, MON-2 · Stories: mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th

**Preconditions**

- Status computation function available with confirmed calendar-month/server-timezone definition

**Steps**

1. Provide an employee with a payment in the current month
2. Provide an employee with a payment only in a prior month
3. Compute status for the current month

**Expected:** First employee computes as paid, second computes as unpaid using the confirmed calendar-month, server-timezone definition

#### TC-023 — Month-boundary edge case for current-month status

`unit` · `medium` · Requirements: MON-1 · Stories: mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th

**Preconditions**

- Status computation with confirmed month definition
- Ability to fix server clock to last second of a month and first second of next

**Steps**

1. Set server time to the final moment of month N; compute period
2. Set server time to the first moment of month N+1; compute period

**Expected:** Current-month period resolves to N then N+1 respectively per the confirmed server-timezone calendar-month rule

#### TC-024 — Paid and unpaid employees are visually distinguishable

`accessibility` · `medium` · Requirements: MON-2 · Stories: mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th

**Preconditions**

- Monthly view with at least one paid and one unpaid employee

**Steps**

1. Manually review the status indicators on the monthly view
2. Check that distinction does not rely on color alone (icon/text label present)
3. Verify indicators are perceivable with a screen reader

**Expected:** Paid and unpaid states are clearly distinguishable with non-color cues and accessible labels

#### TC-025 — Monthly view shows no totals or aggregate summaries

`e2e` · `medium` · Requirements: MON-5 · Stories: mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th

**Preconditions**

- Logged-in admin, monthly view populated

**Steps**

1. Open the monthly payment view
2. Scan the page for any total, count, sum, or summary metric

**Expected:** No aggregate totals or summary metrics are displayed anywhere on the view

#### TC-026 — Mark-as-paid prefills stored salary and requires payment date

`e2e` · `high` · Requirements: MON-3, PAY-1, PAY-2 · Stories: mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-

**Preconditions**

- Logged-in admin
- Unpaid employee with stored salary 5000 for current month

**Steps**

1. Click mark-as-paid for the unpaid employee
2. Observe the prefilled amount
3. Attempt to save with no payment date
4. Enter a payment date and save

**Expected:** Amount is prefilled to 5000; saving without a date is blocked; saving with a date succeeds

#### TC-027 — Status updates to paid immediately after successful mark-as-paid

`e2e` · `high` · Requirements: MON-4 · Stories: mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-

**Preconditions**

- Logged-in admin, unpaid employee for current month

**Steps**

1. Mark the employee as paid with a valid payment date
2. Observe the monthly view status for that employee

**Expected:** Employee status changes to paid immediately without needing a manual refresh

#### TC-028 — Payment record persists employee, month, amount, and date

`integration` · `high` · Requirements: PAY-4, PAY-1, PAY-2 · Stories: mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-

**Preconditions**

- Logged-in admin, unpaid employee salary 5000

**Steps**

1. Mark the employee paid with payment date today
2. Query the Payment record in the database

**Expected:** Payment row stores the correct employee reference, current month, amount 5000, and the captured payment date

#### TC-029 — Duplicate mark-as-paid creates no second payment

`integration` · `high` · `negative` · Requirements: PAY-3, MON-4 · Stories: mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-

**Preconditions**

- Logged-in admin, employee already paid for current month

**Steps**

1. Attempt to mark the same employee paid again for the same month
2. Query the Payment table for that employee and month

**Expected:** No duplicate row is created; exactly one payment exists for that employee/month

#### TC-030 — Concurrent duplicate mark-as-paid requests remain idempotent

`integration` · `high` · `negative` · Requirements: PAY-3, PAY-4 · Stories: mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-

**Preconditions**

- Logged-in admin, unpaid employee for current month

**Steps**

1. Fire two mark-as-paid requests concurrently for the same employee/month
2. Query the Payment table after both complete

**Expected:** At most one Payment row exists with correct employee, month, amount and date; the second request fails gracefully or is a no-op

#### TC-031 — Payment does not capture payment method or notes

`integration` · `medium` · Requirements: PAY-5 · Stories: mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-

**Preconditions**

- Logged-in admin, unpaid employee

**Steps**

1. Open the mark-as-paid form
2. Inspect the fields present
3. Record a payment and inspect the stored Payment row

**Expected:** No payment method or notes field is offered or stored; Payment schema has no such columns

#### TC-032 — Payment records are immutable at the data-access layer

`unit` · `high` · `negative` · Requirements: HIST-3, EMP-5 · Stories: mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-

**Preconditions**

- Data-access layer available

**Steps**

1. Inspect the payment repository/data-access module
2. Confirm no update or delete operations for payments exist

**Expected:** Payment data-access layer provides only create and read; no path to edit or delete a payment

#### TC-033 — Manual exploratory testing of immutability and error messaging

`manual` · `medium` · `negative` · Requirements: EMP-3, EMP-4, AUTH-5 · Stories: emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte

**Preconditions**

- Full app deployed locally

**Steps**

1. Explore the UI and craft direct requests attempting to edit/delete employees and payments
2. Attempt varied invalid logins and observe messaging

**Expected:** No immutability bypass is found and error messages never reveal which credential field was wrong

#### TC-034 — Manual verification of SQLite file permissions and backup guidance

`manual` · `medium` · Requirements: PAY-4, EMP-1 · Stories: emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas

**Preconditions**

- App deployed on target host

**Steps**

1. Inspect filesystem permissions on the SQLite database file
2. Confirm the file is restricted to the operator account
3. Verify backup guidance is documented

**Expected:** SQLite file has restricted permissions and documented backup guidance exists

#### TC-035 — Login form accessibility review

`accessibility` · `low` · Requirements: AUTH-1 · Stories: auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a

**Preconditions**

- Login screen available

**Steps**

1. Navigate the login form using keyboard only
2. Check labels and error announcements with a screen reader

**Expected:** Fields are labeled, keyboard-navigable, and errors are announced accessibly


### Sprint 2

#### TC-036 — Employee payment history lists every recorded payment with month, amount, and date

`integration` · `high` · Requirements: HIST-1, HIST-2 · Stories: hist-1-as-an-admin-i-want-to-view-a-per-employee-payment-history-listing-ever

**Preconditions**

- Logged in as eadmin with valid session cookie
- An employee exists with at least 3 recorded payments across different months

**Steps**

1. Request the payment history for the target employee
2. Inspect the returned list of payment entries

**Expected:** Every recorded payment for that employee is returned, each entry showing the period month, salary amount, and payment date matching the stored records

#### TC-037 — Newly recorded payment appears in the employee's history

`e2e` · `high` · Requirements: HIST-1 · Stories: hist-1-as-an-admin-i-want-to-view-a-per-employee-payment-history-listing-ever

**Preconditions**

- Logged in as eadmin
- An employee exists

**Steps**

1. Navigate to the monthly list and mark the employee as paid for the current month
2. Open the employee's payment history view

**Expected:** The just-recorded payment appears in the history with the correct month, amount, and payment date

#### TC-038 — Employee with no payments shows a clear empty-state message

`e2e` · `medium` · `negative` · Requirements: HIST-1 · Stories: hist-1-as-an-admin-i-want-to-view-a-per-employee-payment-history-listing-ever

**Preconditions**

- Logged in as eadmin
- An employee exists with zero recorded payments

**Steps**

1. Open the payment history view for the employee with no payments

**Expected:** A clear empty-state message is shown (e.g. 'No payments recorded yet') and no error occurs

#### TC-039 — Payment history is ordered most-recent-first

`integration` · `medium` · Requirements: HIST-4 · Stories: hist-3-as-an-admin-i-want-the-payment-history-presented-read-only-and-ordered

**Preconditions**

- Logged in as eadmin
- An employee has payments for multiple non-consecutive months

**Steps**

1. Request the employee's payment history
2. Read the order of returned entries by period month

**Expected:** Entries are ordered with the most recent month first, descending through older months

#### TC-040 — Payment history exposes no edit or delete controls in the UI

`e2e` · `high` · Requirements: HIST-3 · Stories: hist-3-as-an-admin-i-want-the-payment-history-presented-read-only-and-ordered

**Preconditions**

- Logged in as eadmin
- An employee has recorded payments

**Steps**

1. Open the employee's payment history view
2. Inspect each payment row for edit, delete, or modify controls

**Expected:** No edit, delete, or modify controls are present on any historical payment entry; the view is read-only

#### TC-041 — No API route allows changing or removing a historical payment

`security` · `high` · `negative` · Requirements: HIST-3 · Stories: hist-3-as-an-admin-i-want-the-payment-history-presented-read-only-and-ordered

**Preconditions**

- Valid eadmin session cookie
- An existing payment record

**Steps**

1. Attempt an HTTP PUT/PATCH request against the payment resource with a valid cookie
2. Attempt an HTTP DELETE request against the payment resource with a valid cookie
3. Re-read the payment record

**Expected:** No route accepts the mutation (405/404/route not found); the stored payment remains unchanged

#### TC-042 — Stored payment amount is immutable at the data-access layer

`integration` · `high` · `negative` · Requirements: HIST-3 · Stories: hist-3-as-an-admin-i-want-the-payment-history-presented-read-only-and-ordered

**Preconditions**

- A payment record exists at the data-access layer

**Steps**

1. Attempt to update the payment amount, month, or date via the data-access layer
2. Re-query the payment record

**Expected:** No update/delete operation is exposed for payments; the stored values equal the originally entered values

#### TC-043 — Payment history requires a valid session cookie

`security` · `high` · `negative` · Requirements: HIST-1 · Stories: hist-1-as-an-admin-i-want-to-view-a-per-employee-payment-history-listing-ever

**Preconditions**

- Payment history route exists

**Steps**

1. Request the payment history route with no cookie
2. Request it with a tampered/invalid cookie
3. Request it with a valid eadmin cookie

**Expected:** Requests with no cookie or a tampered cookie are rejected (401/redirect to login); only the valid cookie returns the history

#### TC-044 — SQLite database file has restricted permissions on the target host

`manual` · `high` · Requirements: HIST-1 · Stories: hist-1-as-an-admin-i-want-the-sqlite-database-secured-with-restricted-permiss

**Preconditions**

- App deployed on target host
- Shell access to the host

**Steps**

1. Inspect the SQLite database file permissions on the host
2. Attempt to read the file as a non-owner user

**Expected:** File permissions restrict access to the app owner only (e.g. 600/owner-only); non-owner cannot read the file

#### TC-045 — Backup guidance is documented and handed over

`manual` · `medium` · Requirements: HIST-1 · Stories: hist-1-as-an-admin-i-want-the-sqlite-database-secured-with-restricted-permiss

**Preconditions**

- Launch handover in progress

**Steps**

1. Locate the backup guidance document
2. Verify it describes how and when to back up and restore the SQLite file
3. Confirm it has been handed to the admin

**Expected:** Clear, actionable backup and restore guidance exists and is confirmed delivered to the admin

#### TC-046 — App handles database access edge cases without crashing

`integration` · `medium` · `negative` · Requirements: HIST-1 · Stories: hist-1-as-an-admin-i-want-the-sqlite-database-secured-with-restricted-permiss

**Preconditions**

- App running
- Ability to simulate DB unavailability (locked/missing/read-only file)

**Steps**

1. Simulate the database file being locked or temporarily unavailable
2. Trigger a read (view history) and a write (mark paid) operation

**Expected:** The app returns a graceful error message and remains running; it does not crash or expose a stack trace to the user

#### TC-047 — All module acceptance criteria pass in QA

`manual` · `high` · Requirements: HIST-1, HIST-2, HIST-3, HIST-4 · Stories: hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run

**Preconditions**

- QA environment prepared
- All sprint features merged

**Steps**

1. Execute the agreed acceptance checklist covering auth, employees, payments, and history modules
2. Record pass/fail for each acceptance criterion

**Expected:** Every module acceptance criterion is verified as passing in QA

#### TC-048 — App is running on the target host and a recorded payment is visible

`manual` · `high` · Requirements: HIST-1, HIST-2 · Stories: hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run

**Preconditions**

- Deployment to target host completed

**Steps**

1. Access the deployed app on its target host
2. Log in as eadmin
3. Mark an employee as paid for the current month
4. Open that employee's payment history in the deployed app

**Expected:** The app is reachable and functional on the target host, and the recorded payment is visible in the employee's history

