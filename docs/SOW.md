# Statement of Work

**Project:** Emp-management
**Application type:** B2E · Internal
**Prepared from:** Budget estimate (Blueprint v0.7)
**Scope basis:** Full approved scope

## 1. Overview
Emp-management is a deliberately tiny single-admin internal tool for tracking monthly salary payments, built as one Next.js app over a local SQLite file. Because the scope is small, predictable, and integration-free, it can be delivered in roughly 3 weeks end-to-end; the modest cost drivers are the create-only/idempotent data rules and getting the monthly paid/unpaid flow correct, not scale or security infrastructure.

## 2. Scope of Work
The following deliverables are included in this engagement:

| # | Deliverable | Category | Effort | Fee |
| --- | --- | --- | --- | --- |
| 1 | Project scaffold & data layer | Phase 0 — Foundation | 0.5 wks | $1,500 |
| 2 | Admin authentication & session | Phase 1 — Authentication | 0.5 wks | $1,500 |
| 3 | Employee management | Phase 2 — Employee Management | 0.5 wks | $2,000 |
| 4 | Monthly view & payment recording | Phase 3 — Monthly View & Payment Recording | 1 wk | $3,000 |
| 5 | Payment history | Phase 4 — Payment History | 0.5 wks | $1,500 |
| 6 | Hardening, QA & launch | Phase 5 — Hardening & Launch | 0.5 wks | $2,000 |

## 3. Timeline
Estimated delivery: **3 wks** from kickoff.

## 4. Fees
| Item | Amount |
| --- | --- |
| Scope subtotal | $11,500 |
| **Total project fee** | **$11,500** |

Fees are fixed for the scope above. Changes to scope may adjust fees and timeline by written change order.

## 5. Assumptions
- Delivered by a small offshore AI-native pod: one senior full-stack engineer steering AI agents part-time, with fractional QA and PM oversight.
- Scope is exactly as specified in the PRD/Blueprint — no employee logins, no edits/deletes, no salary revisions, no totals, no external integrations.
- Authentication remains the single hardcoded credential pair; no rotation, SSO, or multi-user provisioning is built.
- Persistence is a single local SQLite file on one host; backup is delivered as documented guidance rather than automated infrastructure.
- LLM/agent usage and hosting run costs are negligible at this scale and assumed absorbed within delivery.
- Payment recording assumed for the current month with view-only history unless the open question resolves otherwise; arbitrary past-month recording would add minor effort.
- Excludes ongoing maintenance, support, and any hardware/premises costs.

## 6. Acceptance
This Statement of Work is non-binding until countersigned by both parties. Signing confirms the scope, timeline, and fees above as the agreed basis for delivery.
