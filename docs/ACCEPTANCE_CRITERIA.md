# Acceptance Criteria

Employee Management

**Requirements covered:** 25/25
**Acceptance criteria:** 38

## Traceability

| Requirement | Module | Priority | Stories | Criteria |
| --- | --- | --- | --- | --- |
| AUTH-1 | Authentication & Session | Must | S1 auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a | 3 |
| AUTH-2 | Authentication & Session | Must | S1 auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a | 3 |
| AUTH-3 | Authentication & Session | Must | S1 auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha | 3 |
| AUTH-4 | Authentication & Session | Should | S1 auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha | 3 |
| AUTH-5 | Authentication & Session | Should | S1 auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a | 3 |
| EMP-1 | Employee Management | Must | S1 emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas<br>S1 emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl | 8 |
| EMP-2 | Employee Management | Must | S1 emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl | 3 |
| EMP-3 | Employee Management | Must | S1 emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte | 3 |
| EMP-4 | Employee Management | Must | S1 emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte | 3 |
| EMP-5 | Employee Management | Must | S1 emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas<br>S1 emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte | 8 |
| EMP-6 | Employee Management | Should | S1 emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl | 3 |
| MON-1 | Monthly Payment View | Must | S1 mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th | 3 |
| MON-2 | Monthly Payment View | Must | S1 mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th | 3 |
| MON-3 | Monthly Payment View | Must | S1 mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that- | 6 |
| MON-4 | Monthly Payment View | Must | S1 mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that- | 6 |
| MON-5 | Monthly Payment View | Should | S1 mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th | 3 |
| PAY-1 | Salary Payment Recording | Must | S1 mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that- | 6 |
| PAY-2 | Salary Payment Recording | Must | S1 mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that- | 6 |
| PAY-3 | Salary Payment Recording | Must | S1 mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that- | 6 |
| PAY-4 | Salary Payment Recording | Must | S1 emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas<br>S1 mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that- | 11 |
| PAY-5 | Salary Payment Recording | Should | S1 mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that- | 6 |
| HIST-1 | Payment History | Must | S2 hist-1-as-an-admin-i-want-to-view-a-per-employee-payment-history-listing-ever<br>S2 hist-1-as-an-admin-i-want-the-sqlite-database-secured-with-restricted-permiss<br>S2 hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run | 9 |
| HIST-2 | Payment History | Must | S2 hist-1-as-an-admin-i-want-to-view-a-per-employee-payment-history-listing-ever<br>S2 hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run | 6 |
| HIST-3 | Payment History | Must | S2 hist-3-as-an-admin-i-want-the-payment-history-presented-read-only-and-ordered<br>S2 hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run | 6 |
| HIST-4 | Payment History | Should | S2 hist-3-as-an-admin-i-want-the-payment-history-presented-read-only-and-ordered<br>S2 hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run | 6 |

## Criteria by requirement

### AUTH-1 — The system shall authenticate the admin only when username equals 'eadmin' and password equals 'epassword'.

**auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a** (Sprint 1) — As the admin, I want to log in with my credentials so that only I can access the tool

- Logging in with eadmin/epassword grants access
- Any other credentials are rejected with a non-specific error that does not reveal which field was incorrect
- A signed HTTP-only session cookie is set after a successful login

### AUTH-2 — The system shall establish a signed HTTP-only session cookie upon successful login.

**auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a** (Sprint 1) — As the admin, I want to log in with my credentials so that only I can access the tool

- Logging in with eadmin/epassword grants access
- Any other credentials are rejected with a non-specific error that does not reveal which field was incorrect
- A signed HTTP-only session cookie is set after a successful login

### AUTH-3 — The system shall redirect any unauthenticated request for protected pages or actions to the login screen.

**auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha** (Sprint 1) — As the admin, I want protected pages guarded and a logout action so that unauthorized access is blocked

- Accessing a protected route without a session redirects to login
- Logout clears the session cookie and returns the user to login
- After logout, protected routes remain inaccessible until re-login

### AUTH-4 — The system shall provide a logout action that clears the session cookie and returns the user to login.

**auth-3-as-the-admin-i-want-protected-pages-guarded-and-a-logout-action-so-tha** (Sprint 1) — As the admin, I want protected pages guarded and a logout action so that unauthorized access is blocked

- Accessing a protected route without a session redirects to login
- Logout clears the session cookie and returns the user to login
- After logout, protected routes remain inaccessible until re-login

### AUTH-5 — The system shall display a non-specific error message on failed login without revealing which field was incorrect.

**auth-1-as-the-admin-i-want-to-log-in-with-my-credentials-so-that-only-i-can-a** (Sprint 1) — As the admin, I want to log in with my credentials so that only I can access the tool

- Logging in with eadmin/epassword grants access
- Any other credentials are rejected with a non-specific error that does not reveal which field was incorrect
- A signed HTTP-only session cookie is set after a successful login

### EMP-1 — The system shall allow the admin to create an employee with name, designation, date of birth, and salary.

**emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas** (Sprint 1) — As the operator, I want the application scaffolded with a local database so that employee and payment data can be stored reliably

- The application starts locally and connects to the SQLite database
- The Employee table stores name, designation, date of birth, and salary
- The Payment table stores employee reference, month, salary amount, and payment date
- A unique constraint exists preventing more than one payment per employee per month
- The initial migration applies cleanly to an empty database

**emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl** (Sprint 1) — As the admin, I want to add an employee so that they appear in the employee list

- A new employee with name, designation, date of birth, and a positive salary is saved and appears in the employee list
- Submitting with a missing field or a non-positive salary is rejected and no record is created
- The stored salary matches the value entered at creation

### EMP-2 — The system shall validate that name, designation, date of birth, and a positive numeric salary are provided before saving.

**emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl** (Sprint 1) — As the admin, I want to add an employee so that they appear in the employee list

- A new employee with name, designation, date of birth, and a positive salary is saved and appears in the employee list
- Submitting with a missing field or a non-positive salary is rejected and no record is created
- The stored salary matches the value entered at creation

### EMP-3 — The system shall prevent any editing of an employee record after creation.

**emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte** (Sprint 1) — As the admin, I want employee records to be immutable so that data integrity is preserved

- No UI or API path exists to edit an existing employee
- No UI or API path exists to delete an existing employee
- A stored employee's salary cannot be changed after creation

### EMP-4 — The system shall prevent deletion of any employee record.

**emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte** (Sprint 1) — As the admin, I want employee records to be immutable so that data integrity is preserved

- No UI or API path exists to edit an existing employee
- No UI or API path exists to delete an existing employee
- A stored employee's salary cannot be changed after creation

### EMP-5 — The system shall store each employee's salary as a fixed value that is not modifiable.

**emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas** (Sprint 1) — As the operator, I want the application scaffolded with a local database so that employee and payment data can be stored reliably

- The application starts locally and connects to the SQLite database
- The Employee table stores name, designation, date of birth, and salary
- The Payment table stores employee reference, month, salary amount, and payment date
- A unique constraint exists preventing more than one payment per employee per month
- The initial migration applies cleanly to an empty database

**emp-3-as-the-admin-i-want-employee-records-to-be-immutable-so-that-data-inte** (Sprint 1) — As the admin, I want employee records to be immutable so that data integrity is preserved

- No UI or API path exists to edit an existing employee
- No UI or API path exists to delete an existing employee
- A stored employee's salary cannot be changed after creation

### EMP-6 — The system shall display a list of all employees.

**emp-1-as-the-admin-i-want-to-add-an-employee-so-that-they-appear-in-the-empl** (Sprint 1) — As the admin, I want to add an employee so that they appear in the employee list

- A new employee with name, designation, date of birth, and a positive salary is saved and appears in the employee list
- Submitting with a missing field or a non-positive salary is rejected and no record is created
- The stored salary matches the value entered at creation

### MON-1 — The system shall list all employees together with their paid or unpaid status for the current month.

**mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th** (Sprint 1) — As the admin, I want a monthly view showing who is paid or unpaid so that I can see current-month payment status

- The monthly view lists every employee with an accurate paid/unpaid indicator for the current month
- Paid and unpaid employees are visually distinguishable
- No aggregate totals or summary metrics appear on the monthly view

### MON-2 — The system shall visually distinguish paid from unpaid employees for the current month.

**mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th** (Sprint 1) — As the admin, I want a monthly view showing who is paid or unpaid so that I can see current-month payment status

- The monthly view lists every employee with an accurate paid/unpaid indicator for the current month
- Paid and unpaid employees are visually distinguishable
- No aggregate totals or summary metrics appear on the monthly view

### MON-3 — The system shall provide a mark-as-paid action for any employee whose current month is unpaid.

**mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-** (Sprint 1) — As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded

- Marking an employee paid prefills the employee's fixed salary
- A payment date is required before the payment can be saved
- The employee's status updates to paid immediately after a successful action
- A second attempt to mark the same employee/month paid creates no duplicate record
- A recorded payment stores the employee, month, salary amount, and payment date
- No payment method or notes are captured with the payment

### MON-4 — The system shall update an employee's status to paid immediately after a successful mark-as-paid action.

**mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-** (Sprint 1) — As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded

- Marking an employee paid prefills the employee's fixed salary
- A payment date is required before the payment can be saved
- The employee's status updates to paid immediately after a successful action
- A second attempt to mark the same employee/month paid creates no duplicate record
- A recorded payment stores the employee, month, salary amount, and payment date
- No payment method or notes are captured with the payment

### MON-5 — The system shall not display totals or aggregate summary metrics on the monthly view.

**mon-1-as-the-admin-i-want-a-monthly-view-showing-who-is-paid-or-unpaid-so-th** (Sprint 1) — As the admin, I want a monthly view showing who is paid or unpaid so that I can see current-month payment status

- The monthly view lists every employee with an accurate paid/unpaid indicator for the current month
- Paid and unpaid employees are visually distinguishable
- No aggregate totals or summary metrics appear on the monthly view

### PAY-1 — The system shall prefill the salary amount from the employee's stored salary when recording a monthly payment.

**mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-** (Sprint 1) — As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded

- Marking an employee paid prefills the employee's fixed salary
- A payment date is required before the payment can be saved
- The employee's status updates to paid immediately after a successful action
- A second attempt to mark the same employee/month paid creates no duplicate record
- A recorded payment stores the employee, month, salary amount, and payment date
- No payment method or notes are captured with the payment

### PAY-2 — The system shall require a payment date to be captured when marking a salary as paid.

**mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-** (Sprint 1) — As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded

- Marking an employee paid prefills the employee's fixed salary
- A payment date is required before the payment can be saved
- The employee's status updates to paid immediately after a successful action
- A second attempt to mark the same employee/month paid creates no duplicate record
- A recorded payment stores the employee, month, salary amount, and payment date
- No payment method or notes are captured with the payment

### PAY-3 — The system shall record at most one payment per employee per month (idempotent marking).

**mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-** (Sprint 1) — As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded

- Marking an employee paid prefills the employee's fixed salary
- A payment date is required before the payment can be saved
- The employee's status updates to paid immediately after a successful action
- A second attempt to mark the same employee/month paid creates no duplicate record
- A recorded payment stores the employee, month, salary amount, and payment date
- No payment method or notes are captured with the payment

### PAY-4 — The system shall persist each payment with employee reference, month, salary amount, and payment date.

**emp-1-as-the-operator-i-want-the-application-scaffolded-with-a-local-databas** (Sprint 1) — As the operator, I want the application scaffolded with a local database so that employee and payment data can be stored reliably

- The application starts locally and connects to the SQLite database
- The Employee table stores name, designation, date of birth, and salary
- The Payment table stores employee reference, month, salary amount, and payment date
- A unique constraint exists preventing more than one payment per employee per month
- The initial migration applies cleanly to an empty database

**mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-** (Sprint 1) — As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded

- Marking an employee paid prefills the employee's fixed salary
- A payment date is required before the payment can be saved
- The employee's status updates to paid immediately after a successful action
- A second attempt to mark the same employee/month paid creates no duplicate record
- A recorded payment stores the employee, month, salary amount, and payment date
- No payment method or notes are captured with the payment

### PAY-5 — The system shall not capture payment method or notes with a payment.

**mon-3-as-the-admin-i-want-to-mark-an-employee-as-paid-for-the-month-so-that-** (Sprint 1) — As the admin, I want to mark an employee as paid for the month so that their salary payment is recorded

- Marking an employee paid prefills the employee's fixed salary
- A payment date is required before the payment can be saved
- The employee's status updates to paid immediately after a successful action
- A second attempt to mark the same employee/month paid creates no duplicate record
- A recorded payment stores the employee, month, salary amount, and payment date
- No payment method or notes are captured with the payment

### HIST-1 — The system shall display a per-employee list of all recorded payments across past months.

**hist-1-as-an-admin-i-want-to-view-a-per-employee-payment-history-listing-ever** (Sprint 2) — As an Admin, I want to view a per-employee payment history listing every recorded payment so that I can see the salary paid across past months

- An employee's history lists every recorded payment with month, amount, and date
- A newly recorded payment appears in the employee's history
- An employee with no payments shows a clear empty-state message

**hist-1-as-an-admin-i-want-the-sqlite-database-secured-with-restricted-permiss** (Sprint 2) — As an Admin, I want the SQLite database secured with restricted permissions and documented backup guidance so that my salary data is protected and recoverable

- The SQLite file is stored with restricted permissions accessible only to the app owner
- Backup guidance is documented and handed over to the admin
- Edge cases around database access are handled without crashing the app

**hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run** (Sprint 2) — As an Admin, I want the tool verified against acceptance checks and running on its target host so that I can start using it for real

- All module acceptance criteria pass in QA
- The app is running on the target host
- A recorded payment is visible in the deployed app's employee history

### HIST-2 — The system shall show the month, salary amount, and payment date for each historical payment.

**hist-1-as-an-admin-i-want-to-view-a-per-employee-payment-history-listing-ever** (Sprint 2) — As an Admin, I want to view a per-employee payment history listing every recorded payment so that I can see the salary paid across past months

- An employee's history lists every recorded payment with month, amount, and date
- A newly recorded payment appears in the employee's history
- An employee with no payments shows a clear empty-state message

**hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run** (Sprint 2) — As an Admin, I want the tool verified against acceptance checks and running on its target host so that I can start using it for real

- All module acceptance criteria pass in QA
- The app is running on the target host
- A recorded payment is visible in the deployed app's employee history

### HIST-3 — The system shall present payment history as read-only with no edit or delete controls.

**hist-3-as-an-admin-i-want-the-payment-history-presented-read-only-and-ordered** (Sprint 2) — As an Admin, I want the payment history presented read-only and ordered most-recent-first so that I can review it safely and find recent months quickly

- Payments in the history are ordered most-recent-first
- No controls to modify or remove historical payment entries are present
- No route or control allows changing a historical payment entry

**hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run** (Sprint 2) — As an Admin, I want the tool verified against acceptance checks and running on its target host so that I can start using it for real

- All module acceptance criteria pass in QA
- The app is running on the target host
- A recorded payment is visible in the deployed app's employee history

### HIST-4 — The system shall order payment history so the most relevant (recent) months are easy to find.

**hist-3-as-an-admin-i-want-the-payment-history-presented-read-only-and-ordered** (Sprint 2) — As an Admin, I want the payment history presented read-only and ordered most-recent-first so that I can review it safely and find recent months quickly

- Payments in the history are ordered most-recent-first
- No controls to modify or remove historical payment entries are present
- No route or control allows changing a historical payment entry

**hist-1-as-an-admin-i-want-the-tool-verified-against-acceptance-checks-and-run** (Sprint 2) — As an Admin, I want the tool verified against acceptance checks and running on its target host so that I can start using it for real

- All module acceptance criteria pass in QA
- The app is running on the target host
- A recorded payment is visible in the deployed app's employee history

