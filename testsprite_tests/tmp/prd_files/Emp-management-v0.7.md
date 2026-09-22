# Product Requirements Document

Application type: B2E · Internal

## Overview & Problem
- A very simple employee management system focused on tracking monthly salary payments.
- A single admin logs in to create employees and mark monthly salaries as paid.
- No employee logins, no timesheets — only salary payment status per month.

## Goals & Success Metrics
- Allow an admin to maintain a minimal employee record.
- Track whether each employee's salary has been paid for a given month.
- Keep the application intentionally lightweight and easy to use.

## Target Users & Personas
- Admin: the sole user who logs in to manage employees and record salary payments.

## User Stories & Requirements
- Admin login with username 'eadmin' and password 'epassword' (hardcoded, permanent).
- Create employee with minimal fields: name, designation, date of birth, salary.
- Salary amount is prefilled from the employee's stored salary when marking a monthly payment.
- When marking a salary as paid, capture a payment date.
- Monthly view/action to mark an employee's salary as paid ('done') for that month.
- Monthly view lists all employees with their paid/unpaid status for the current month.
- Track salary paid vs not-paid status per employee per month.
- Maintain a payment history of past months' payments per employee.
- Employee records are create-only: admin cannot edit or delete them after creation.
- Salary is a fixed amount per employee and does not change over time.

## In Scope
- Single hardcoded admin login.
- Employee creation with minimal data.
- Marking monthly salary as paid with prefilled salary and payment date.
- Monthly view of all employees with current-month paid/unpaid status.
- Viewing past months' payment history per employee.

## Out of Scope
- Employee logins.
- Employee timesheets.
- Attendance or leave tracking.
- Editing or deleting employee records after creation.
- Salary changes over time / salary revision history.
- Totals or summary metrics on the monthly view.
- Payment method or notes alongside payments.

## Non-functional Requirements
- Simplicity and ease of use is a primary priority.
- Built with Next.js as the application tech stack.
- Uses a local SQLite database only (no Postgres or other databases).

## Assumptions & Risks
- Only one admin uses the system.
- Salary is a fixed monthly amount per employee and never changes.
- Hardcoded admin credentials are the permanent authentication approach.
- Payment date is captured when marking a salary as paid.
- SQLite database file is stored locally alongside the application.

## Open Questions
_Not captured yet._
