# Project Plan

**Project:** Employee Management
**Application type:** B2E · Internal
**Total duration:** 3 wks
**Total investment:** $11,500
**Scope basis:** Full approved scope

## Summary
Employee Management is a deliberately tiny single-admin internal tool for tracking monthly salary payments, built as one Next.js app over a local SQLite file. Because the scope is small, predictable, and integration-free, it can be delivered in roughly 3 weeks end-to-end; the modest cost drivers are the create-only/idempotent data rules and getting the monthly paid/unpaid flow correct, not scale or security infrastructure.

## 1. Purpose & how to read this plan

This plan turns the approved Technical Design Document into delivery work. Every user story references the requirement IDs it satisfies, so any line of the plan can be traced back to the TDD and forward to the sprint that delivers it. Requirement coverage is checked in Appendix A: if a requirement is not delivered by a story, it is named there rather than quietly dropped.

**Requirement ID scheme:** 25 requirement ids reused verbatim from the Technical Design Document; 0 assigned by Idea2Launch as <MODULE>-<n> for modules the TDD left un-numbered.

Section 6 — the per-sprint stories, tasks and acceptance criteria — is published separately as the **Sprint Plan** document.

## 2. Planning assumptions & team model

| Input | Value |
| --- | --- |
| Cadence | 2-week sprints; 2 sprints total. Sprint 1 covers weeks 1-2, Sprint 2 covers week 3 only. |
| Sprints | 2 |
| Timeline | 3 weeks from kickoff |
| Velocity | Planning to the agreed task set of ~3.5 person-weeks of scope compressed across 3 calendar weeks, achievable because AI agents carry the implementation and test load under senior review. |
| Estimation unit | person-weeks (as provided in the task breakdown and AI-usage matrix) |
| Total committed points | 47 |

**Team model**

- Senior engineer (offshore) steers implementation and reviews AI output; AI agents do the bulk of coding and test authoring per the AI-usage matrix (e.g. Phase 4 engineer 0.4 human / 0.6 AI person-weeks).
- Architect provides light foundation oversight in Phase 1 (0.1 human / 0.1 AI person-weeks).
- QA (human-guided, AI-assisted) validates employee management, payment recording and the final hardening pass.
- DevOps handles single-host deployment and filesystem permissions in the launch phase.
- PM coordinates client gates and sign-offs (0.1 human person-weeks in the launch phase).

**Assumptions made**

- Sprint boundaries are fixed as given; Sprint 2 is a single week, so its scope (payment history + hardening/launch) is deliberately light.
- No cost or budget figures are restated or recomputed; scheduling only.
- Task phase numbers in the breakdown (1-6) are mapped onto the two fixed sprints; sprint 'phase' reflects the dominant delivery phase of the sprint.
- Open technical questions (month navigation, backup strategy, network exposure) are tracked as open decisions rather than blocking build.

Human and AI capacity per phase is tabulated under "AI usage by phase & function" below.

## 3. Estimation approach

Work is estimated in relative story points on the Fibonacci scale — never in hours.

| Points | Means |
| --- | --- |
| 1 | Trivial, well understood, no unknowns — a config change or a copy edit. |
| 2 | Small and familiar; one file or one screen, no new integration. |
| 3 | A normal slice of work: a few files, a known pattern, tests included. |
| 5 | Substantial: crosses layers (UI + API + data) or introduces a new pattern. |
| 8 | Large: a new integration, migration, or a subsystem with real unknowns. |
| 13 | Too large to trust — split it before the sprint starts. |

**Definition of Ready** — a story may not enter a sprint until:

- The story states a role, a capability, and a benefit.
- It references at least one requirement id from the Technical Design Document.
- Acceptance criteria are written and testable by someone who did not build it.
- External dependencies (credentials, third-party accounts, content) are identified and available.
- It is estimated at 8 points or fewer; anything larger is split first.

**Definition of Done** — a story is not done until:

- Every acceptance criterion demonstrably passes.
- Automated tests cover the change — unit, integration, or end-to-end as appropriate.
- Typecheck and build are clean and the full test suite passes.
- The change is peer reviewed and merged to the main branch.
- Documentation is updated where behaviour or architecture changed.
- The work is deployed to the review environment and demoable.

## 4. Sprint roadmap at a glance

| Sprint | Weeks | Theme | Goal | Points |
| --- | --- | --- | --- | --- |
| 1 | 1–2 | Foundations, Auth & Core Payment Flow | This sprint stands up the whole working core of the tool. We set up the application and its local database, build the single-admin login so only the operator can get in, let the admin add employees, and deliver the main monthly screen that shows who has and hasn't been paid along with the ability to mark someone as paid for the month. By the end of this sprint the admin can log in, add employees, and record salary payments for the current month. | 31 |
| 2 | 3–3 | Payment History, Hardening & Launch | This short closing sprint adds the per-employee payment history so the admin can see every past month a salary was recorded, then hardens and ships the tool. We tidy up edge cases, lock down the database file permissions, write down simple backup guidance, run the tool against the agreed acceptance checks, and deploy it to its single host so the admin can start using it for real. | 16 |

**Critical path.** Both sprints sit on the critical path. Sprint 1 must complete first because the data layer, authentication and employee records are prerequisites for everything else; the monthly view and payment recording depend directly on employees existing and on a protected session. Sprint 2's payment history depends on payment records produced in Sprint 1, and hardening/launch closes the release, so slippage anywhere delays the go-live.

## 5. Product backlog

Epics mirror the feature areas of the Technical Design Document.

| Epic | TDD area / module | Requirement IDs | Sprint |
| --- | --- | --- | --- |
| Authentication & Session | Authentication & Session | AUTH-1, AUTH-2, AUTH-3, AUTH-4, AUTH-5 | 1 |
| Employee Management | Employee Management | EMP-1, EMP-2, EMP-3, EMP-4, EMP-5, EMP-6 | 1 |
| Monthly Payment View | Monthly Payment View | MON-1, MON-2, MON-3, MON-4, MON-5 | 1 |
| Salary Payment Recording | Salary Payment Recording | PAY-1, PAY-2, PAY-3, PAY-4, PAY-5 | 1 |
| Payment History | Payment History | HIST-1, HIST-2, HIST-3, HIST-4 | 2 |
| Foundation & Data Layer | System Architecture / Foundation | — | 1 |
| Hardening, QA & Launch | Hardening & Launch | — | 2 |

## 6. Sprint detail

Published separately as the **Sprint Plan** document: per-sprint goals, the stories and tasks table, acceptance/demo criteria, and sprint-level dependencies and risks.

## 7. Cross-sprint dependency map

| Sprint | Depends on | Required by | Why |
| --- | --- | --- | --- |
| 1 | — | 2 | No upstream dependency — this sprint can start at kickoff. |
| 2 | 1 | — | Needs the deliverables of sprint 1 in place. |

The critical path runs through the sprints with the longest dependency chain: Both sprints sit on the critical path. Sprint 1 must complete first because the data layer, authentication and employee records are prerequisites for everything else; the monthly view and payment recording depend directly on employees existing and on a protected session. Sprint 2's payment history depends on payment records produced in Sprint 1, and hardening/launch closes the release, so slippage anywhere delays the go-live..

## 8. Consolidated risk register

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Hardcoded permanent admin credentials cannot be rotated and are shared knowledge. | High | Restrict deployment to a trusted/isolated network; document the limitation and recommend reverse-proxy access control if external reachability is ever needed. | Architect / DevOps |
| Single local SQLite file with no defined backup strategy. | Medium | Provide basic backup/export guidance and restricted filesystem permissions as a launch deliverable; track the backup-strategy decision. | DevOps |
| Ambiguous month navigation (current-month only vs arbitrary past months). | Low | Default to current-month-only, isolate month logic to allow later extension, and resolve the open decision in Sprint 1. | Product Owner |
| Immutable records with no in-app correction path mean data-entry mistakes need direct DB intervention. | Low | Add strong field validation at create time and document the manual DB correction procedure for the operator. | Senior Engineer |
| Compressed 3-week timeline with a single-week second sprint gives little schedule slack. | Medium | Front-load all Must requirements into Sprint 1 and keep Sprint 2 to independently shippable history and hardening work. | PM |

## 9. Open decisions

| Decision | Needed by | Owner | Default if unresolved |
| --- | --- | --- | --- |
| Can the admin record payments for arbitrary past months, or only the current month with history being view-only? | Sprint 1 | Product Owner | Current-month-only recording; history is view-only. |
| How should the local SQLite file be backed up or exported to prevent data loss? | Sprint 2 | DevOps | Documented manual file-copy backup guidance handed to the operator. |
| Should the app be restricted to a local network or have additional access control given hardcoded credentials? | Sprint 2 | Architect | Restrict to trusted local network only; no external exposure. |
| How is a 'month' defined and displayed and how are month boundaries handled? | Sprint 1 | Product Owner | Calendar month in the server timezone, displayed as YYYY-MM. |

## 10. Ceremonies & progress tracking

| Ceremony | Cadence | Purpose |
| --- | --- | --- |
| Sprint planning | Day 1 of each 2-week sprint | Commit to the sprint's stories against the stated velocity. |
| Daily standup | Daily, 15 minutes | Surface blockers early; re-plan the day, not the sprint. |
| Backlog refinement | Mid-sprint | Bring the next sprint's stories to Definition of Ready. |
| Sprint review / demo | Last day of each sprint | Demonstrate the sprint's exit criteria against working software. |
| Retrospective | Last day of each sprint | Agree one process change to carry into the next sprint. |

Progress is tracked as a burndown of committed story points across each 2-week sprint, with the sprint's issues in the project's GitHub repository as the single source of truth: one milestone per sprint, one issue per story, closed when the story meets the Definition of Done.

## Phased schedule

### Phase 1 · 0.5 wks

| Workstream | Focus | Effort |
| --- | --- | --- |
| Project scaffold & data layer | Set up the Next.js + TypeScript + Tailwind app and configure Prisma with SQLite, the Employee and Payment schema, and the initial migration. | 0.5 wks |

### Phase 2 · 0.5 wks

| Workstream | Focus | Effort |
| --- | --- | --- |
| Admin authentication & session | Build the login screen, server-side hardcoded credential check, signed HTTP-only session cookie, route protection, and logout. | 0.5 wks |

### Phase 3 · 0.5 wks

| Workstream | Focus | Effort |
| --- | --- | --- |
| Employee management | Create-only employee form with field/salary validation, immutable persistence enforced at the data layer, and an employee list view. | 0.5 wks |

### Phase 4 · 1 wk

| Workstream | Focus | Effort |
| --- | --- | --- |
| Monthly view & payment recording | Current-month employee list with paid/unpaid indicators plus the mark-as-paid flow with prefilled salary, captured payment date, and idempotent per-employee-per-month payment creation. | 1 wk |

### Phase 5 · 0.5 wks

| Workstream | Focus | Effort |
| --- | --- | --- |
| Payment history | Per-employee read-only payment history view showing month, salary amount, and payment date in recent-first order. | 0.5 wks |

### Phase 6 · 0.5 wks

| Workstream | Focus | Effort |
| --- | --- | --- |
| Hardening, QA & launch | Edge-case handling, filesystem permissions, basic backup guidance, QA against acceptance criteria, and deployment to the single host. | 0.5 wks |

## AI usage by phase & function
Human vs AI person-weeks under I2L delivery.

### Phase 1 · Foundation

| Function | Human | AI | AI share | What AI does |
| --- | --- | --- | --- | --- |
| Engineering | 0.2 | 0.4 | 67% | AI scaffolds Next.js/Tailwind/Prisma and generates the SQLite schema and migration; engineer reviews boundaries. |
| Architecture | 0.1 | 0.1 | 50% | AI drafts module boundaries for auth/employees/payments; architect confirms the modular monolith shape. |

### Phase 2 · Authentication

| Function | Human | AI | AI share | What AI does |
| --- | --- | --- | --- | --- |
| Engineering | 0.2 | 0.3 | 60% | AI generates login form, hardcoded credential check, signed cookie session, and route guards; engineer verifies server-side enforcement. |

### Phase 3 · Employee Management

| Function | Human | AI | AI share | What AI does |
| --- | --- | --- | --- | --- |
| Engineering | 0.2 | 0.4 | 67% | AI produces the create-only form, validation, and list; engineer enforces immutability at the data layer. |
| QA | 0.1 | 0.1 | 50% | AI drafts validation and no-edit/no-delete test cases. |

### Phase 4 · Monthly View & Payment Recording

| Function | Human | AI | AI share | What AI does |
| --- | --- | --- | --- | --- |
| Engineering | 0.4 | 0.6 | 60% | AI implements the monthly status list and mark-as-paid flow; engineer owns the idempotent unique-constraint logic and prefill correctness. |
| QA | 0.2 | 0.2 | 50% | AI generates duplicate-payment and status-update test scenarios. |

### Phase 5 · Payment History

| Function | Human | AI | AI share | What AI does |
| --- | --- | --- | --- | --- |
| Engineering | 0.2 | 0.3 | 60% | AI builds the read-only per-employee history view and ordering; engineer reviews. |

### Phase 6 · Hardening & Launch

| Function | Human | AI | AI share | What AI does |
| --- | --- | --- | --- | --- |
| QA | 0.2 | 0.2 | 50% | AI runs through acceptance criteria and drafts edge-case checks. |
| DevOps | 0.1 | 0.1 | 50% | AI drafts deploy steps, filesystem permission settings, and backup guidance; engineer executes single-host deploy. |
| Delivery Management | 0.1 | 0 | 0% | Coordinates sign-off and resolves the open month-navigation and backup questions. |

## Investment
| Item | Amount |
| --- | --- |
| Scope subtotal | $11,500 |
| **Total project fee** | **$11,500** |

## Assumptions
- Delivered by a small offshore AI-native pod: one senior full-stack engineer steering AI agents part-time, with fractional QA and PM oversight.
- Scope is exactly as specified in the PRD/Blueprint — no employee logins, no edits/deletes, no salary revisions, no totals, no external integrations.
- Authentication remains the single hardcoded credential pair; no rotation, SSO, or multi-user provisioning is built.
- Persistence is a single local SQLite file on one host; backup is delivered as documented guidance rather than automated infrastructure.
- LLM/agent usage and hosting run costs are negligible at this scale and assumed absorbed within delivery.
- Payment recording assumed for the current month with view-only history unless the open question resolves otherwise; arbitrary past-month recording would add minor effort.
- Excludes ongoing maintenance, support, and any hardware/premises costs.

## Appendix A — Requirement coverage check

| Requirement ID | Delivered by | Sprint |
| --- | --- | --- |
| AUTH-1 | As the admin, I want to log in with my credentials so that only I can access the tool | 1 |
| AUTH-2 | As the admin, I want to log in with my credentials so that only I can access the tool | 1 |
| AUTH-3 | As the admin, I want protected pages guarded and a logout action so that unauthorized access is blocked | 1 |
| AUTH-4 | As the admin, I want protected pages guarded and a logout action so that unauthorized access is blocked | 1 |
| AUTH-5 | As the admin, I want to log in with my credentials so that only I can access the tool | 1 |
| EMP-1 | As the operator, I want the application scaffolded with a local database so that employee and payment data can be stored reliably | 1 |
| EMP-2 | As the admin, I want to add an employee so that they appear in the employee list | 1 |
| EMP-3 | As the admin, I want employee records to be immutable so that data integrity is preserved | 1 |
| EMP-4 | As the admin, I want employee records to be immutable so that data integrity is preserved | 1 |
| EMP-5 | As the operator, I want the application scaffolded with a local database so that employee and payment data can be stored reliably | 1 |
| EMP-6 | As the admin, I want to add an employee so that they appear in the employee list | 1 |
| MON-1 | As the admin, I want a monthly view showing who is paid or unpaid so that I can see current-month payment status | 1 |
| MON-2 | As the admin, I want a monthly view showing who is paid or unpaid so that I can see current-month payment status | 1 |
| MON-3 | As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded | 1 |
| MON-4 | As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded | 1 |
| MON-5 | As the admin, I want a monthly view showing who is paid or unpaid so that I can see current-month payment status | 1 |
| PAY-1 | As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded | 1 |
| PAY-2 | As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded | 1 |
| PAY-3 | As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded | 1 |
| PAY-4 | As the operator, I want the application scaffolded with a local database so that employee and payment data can be stored reliably | 1 |
| PAY-5 | As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded | 1 |
| HIST-1 | As an Admin, I want to view a per-employee payment history listing every recorded payment so that I can see the salary paid across past months | 2 |
| HIST-2 | As an Admin, I want to view a per-employee payment history listing every recorded payment so that I can see the salary paid across past months | 2 |
| HIST-3 | As an Admin, I want the payment history presented read-only and ordered most-recent-first so that I can review it safely and find recent months quickly | 2 |
| HIST-4 | As an Admin, I want the payment history presented read-only and ordered most-recent-first so that I can review it safely and find recent months quickly | 2 |

25 requirements, 0 unmapped.
