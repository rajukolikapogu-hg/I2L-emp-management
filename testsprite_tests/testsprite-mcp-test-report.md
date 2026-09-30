# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** I2L-emp-management
- **Date:** 2026-09-19
- **Prepared by:** TestSprite AI Team
- **Test type / scope:** Frontend, full codebase (first run)
- **Target:** production build (`npm run build && npm start`) at http://localhost:3001
- **Test plan:** [testsprite_frontend_test_plan.json](./testsprite_frontend_test_plan.json)

---

## 2️⃣ Requirement Validation Summary

### Requirement: Authentication and session
- **Description:** Single fixed admin login with a generic failure message; protected pages require a session; logout ends it.

#### Test TC001 Sign in and reach the monthly dashboard
- **Test Code:** [TC001_Sign_in_and_reach_the_monthly_dashboard.py](./TC001_Sign_in_and_reach_the_monthly_dashboard.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/67e2ca71-6a19-4f4e-9ffc-1a1fadd59aea
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Valid credentials (eadmin/epassword) sign in and land on /monthly.
---

#### Test TC003 Sign in and reach the monthly status view
- **Test Code:** [TC003_Sign_in_and_reach_the_monthly_status_view.py](./TC003_Sign_in_and_reach_the_monthly_status_view.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/8f2b0156-4852-4792-8591-184300887940
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** After sign-in the monthly status view renders with the current month heading and status table.
---

#### Test TC009 Reject invalid sign-in credentials
- **Test Code:** [TC009_Reject_invalid_sign_in_credentials.py](./TC009_Reject_invalid_sign_in_credentials.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/19436e38-0986-44e7-a0f1-4352757ca4a7
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Wrong credentials show the single generic message "Invalid username or password." and stay on /login.
---

#### Test TC004 Log out and block access to protected pages
- **Test Code:** [TC004_Log_out_and_block_access_to_protected_pages.py](./TC004_Log_out_and_block_access_to_protected_pages.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/3e573443-68a3-4c69-b2f5-6fe53fd37dc4
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Log out returns to /login; protected pages then redirect to /login.
---

#### Test TC005 Protect monthly view without an active session
- **Test Code:** [TC005_Protect_monthly_view_without_an_active_session.py](./TC005_Protect_monthly_view_without_an_active_session.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/d6067705-2ebe-455c-975e-5f9ff2ac7580
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Visiting /monthly without a session redirects to /login.
---

### Requirement: Navigation
- **Description:** Header links between the monthly view and the employee list while signed in.

#### Test TC007 Move between monthly view and employee list after sign-in
- **Test Code:** [TC007_Move_between_monthly_view_and_employee_list_after_sign_in.py](./TC007_Move_between_monthly_view_and_employee_list_after_sign_in.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/fe778073-ebbc-4949-808e-581505c3ed7a
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Header nav moves between Monthly view and Employees after sign-in.
---

#### Test TC010 Move between monthly and employee views while signed in
- **Test Code:** [TC010_Move_between_monthly_and_employee_views_while_signed_in.py](./TC010_Move_between_monthly_and_employee_views_while_signed_in.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/e3f540ee-d92b-42b9-a567-5bc970fcf012
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Repeated navigation between the monthly and employee views keeps the session.
---

### Requirement: Add employee (create-only)
- **Description:** Create employees with server-side validation that keeps entered values.

#### Test TC008 Create a new employee from the employee list
- **Test Code:** [TC008_Create_a_new_employee_from_the_employee_list.py](./TC008_Create_a_new_employee_from_the_employee_list.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/ac9f63b8-680b-4801-8650-c84e62bcd161
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** The Add employee form creates an employee and shows the "<name> was added." status.
---

#### Test TC006 Create a new employee and see it appear in payroll views
- **Test Code:** [TC006_Create_a_new_employee_and_see_it_appear_in_payroll_views.py](./TC006_Create_a_new_employee_and_see_it_appear_in_payroll_views.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/1e70b073-edf4-4bbd-94db-470dfd1c24df
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** A newly created employee appears in the Employees list and in the monthly view.
---

#### Test TC013 Show validation errors when creating an incomplete employee
- **Test Code:** [TC013_Show_validation_errors_when_creating_an_incomplete_employee.py](./TC013_Show_validation_errors_when_creating_an_incomplete_employee.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/9f1bee3a-02fe-4e10-a850-a6275f47ee7b
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Invalid input is rejected with field-level errors ("Date of birth must be in the past.", "Salary must be a number with at most 2 decimal places.") and all entered values are preserved. Failed on the first run because the generated test was wrong, not the app; corrected and rerun, see Key Gaps / Risks.
---

### Requirement: Monthly status and payment recording
- **Description:** Current-month paid/unpaid status and recording one payment per employee per month.

#### Test TC002 Mark an employee as paid for the current month
- **Test Code:** [TC002_Mark_an_employee_as_paid_for_the_current_month.py](./TC002_Mark_an_employee_as_paid_for_the_current_month.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/e884c0a0-8937-42ef-b7a1-f17496a9fc8f
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Mark as paid shows the salary as a read-only amount, requires a payment date, and the row switches to Paid.
---

#### Test TC012 View a newly added employee from the monthly dashboard
- **Test Code:** [TC012_View_a_newly_added_employee_from_the_monthly_dashboard.py](./TC012_View_a_newly_added_employee_from_the_monthly_dashboard.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/8d2cf03e-5900-4e78-92c6-3fcc5ce104aa
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** A newly added employee is listed as Unpaid on the monthly dashboard and links to their history.
---

#### Test TC014 Reject saving a payment without a payment date
- **Test Code:** [TC014_Reject_saving_a_payment_without_a_payment_date.py](./TC014_Reject_saving_a_payment_without_a_payment_date.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/69cdf1a0-4c56-4363-b89a-193508eb9b06
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Saving a payment without a date is rejected with "Payment date is required."; no payment is recorded.
---

#### Test TC016 Cancel payment entry without changing payroll status
- **Test Code:** [TC016_Cancel_payment_entry_without_changing_payroll_status.py](./TC016_Cancel_payment_entry_without_changing_payroll_status.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/4f1eb93a-4894-423d-9aaa-ffdef17aa566
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Cancel closes the payment form without recording a payment; the status stays Unpaid.
---

### Requirement: Payment history
- **Description:** Read-only per-employee payment history.

#### Test TC011 Review an employee profile and payment history
- **Test Code:** [TC011_Review_an_employee_profile_and_payment_history.py](./TC011_Review_an_employee_profile_and_payment_history.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/b9c4cec1-a166-4251-a594-eff81d7fa873
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** The employee page shows details and the payment history table, most recent month first.
---

#### Test TC015 Show an empty payment history for a new employee
- **Test Code:** [TC015_Show_an_empty_payment_history_for_a_new_employee.py](./TC015_Show_an_empty_payment_history_for_a_new_employee.py)
- **Test Error:** 
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/2e5b8b7d-7b3d-568a-a513-12986e526d48/test/0250e007-985d-4006-8ed7-82b7fe67ef47
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** A new employee with no payments shows "No payments recorded yet.".
---

## 3️⃣ Coverage & Matching Metrics

- **16 of 16 test cases passed (100%)** after one corrected rerun (first run: 15 of 16).

| Requirement | Total Tests | ✅ Passed | ❌ Failed |
|---|---|---|---|
| Authentication and session | 5 | 5 | 0 |
| Navigation | 2 | 2 | 0 |
| Add employee (create-only) | 3 | 3 | 0 |
| Monthly status and payment recording | 4 | 4 | 0 |
| Payment history | 2 | 2 | 0 |

---

## 4️⃣ Key Gaps / Risks

- **TC013 was corrected by hand (test defect, not an app defect).** The generated test typed `not-a-date` into the Date of birth field, which is a native `<input type="date">`. Browsers cannot hold non-date text there (the value stays `""`, and Playwright rejects the fill with "Malformed value"), so the app correctly answered "Date of birth is required." The test also looked for error text inside the inputs instead of the error messages below them. The plan step now uses a future date (2099-01-01), and the committed test asserts the error messages by id and that all four values are preserved. The committed assertions were also checked directly against the running app with Playwright. TestSprite regenerated its own code on the rerun, which passed; the hand-corrected version is committed because the regenerated one still checked text inside the inputs.
- **Not covered by these UI tests:** PUT/PATCH/DELETE returning 405, tampered or replayed session cookies, database immutability triggers, duplicate/concurrent payment idempotency, and accessibility. These are covered by the Vitest suites and the Playwright suite in `e2e/`.
- **Current month only:** payments can only be recorded for the current month, so history across several months is tested only with data from the current month.
- **Test data accumulates:** records are create-only, so each run adds employees and payments to `data/testsprite.db`. Delete that file before a run for a clean state.
