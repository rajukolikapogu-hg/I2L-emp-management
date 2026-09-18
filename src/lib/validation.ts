import { isValidIsoDate } from "./dates";
import { MAX_SALARY_CENTS, parseAmountToCents } from "./money";
import { todayIsoDate } from "./month";

export const NAME_MAX_LENGTH = 120;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

type Result<T, K extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors<K> };

export type EmployeeInput = {
  name: string;
  designation: string;
  dateOfBirth: string;
  salaryCents: number;
};

export type EmployeeField = "name" | "designation" | "dateOfBirth" | "salary";

export function validateEmployeeInput(
  raw: Record<EmployeeField, unknown>,
  now: Date = new Date(),
): Result<EmployeeInput, EmployeeField> {
  const errors: FieldErrors<EmployeeField> = {};
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = text(raw.name);
  if (!name) errors.name = "Name is required.";
  else if (name.length > NAME_MAX_LENGTH)
    errors.name = `Name must be at most ${NAME_MAX_LENGTH} characters.`;

  const designation = text(raw.designation);
  if (!designation) errors.designation = "Designation is required.";
  else if (designation.length > NAME_MAX_LENGTH)
    errors.designation = `Designation must be at most ${NAME_MAX_LENGTH} characters.`;

  const dateOfBirth = text(raw.dateOfBirth);
  if (!dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
  else if (!isValidIsoDate(dateOfBirth)) errors.dateOfBirth = "Enter a valid date of birth.";
  else if (dateOfBirth >= todayIsoDate(now))
    errors.dateOfBirth = "Date of birth must be in the past.";

  const salaryText = text(raw.salary);
  const salaryCents = salaryText ? parseAmountToCents(salaryText) : null;
  if (!salaryText) errors.salary = "Salary is required.";
  else if (salaryCents === null)
    errors.salary = "Salary must be a number with at most 2 decimal places.";
  else if (salaryCents <= 0) errors.salary = "Salary must be greater than zero.";
  else if (salaryCents > MAX_SALARY_CENTS) errors.salary = "Salary is too large.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, designation, dateOfBirth, salaryCents: salaryCents! } };
}

export type PaymentField = "paymentDate";

export function validatePaymentDate(
  raw: unknown,
  now: Date = new Date(),
): Result<string, PaymentField> {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return { ok: false, errors: { paymentDate: "Payment date is required." } };
  if (!isValidIsoDate(value))
    return { ok: false, errors: { paymentDate: "Enter a valid payment date." } };
  if (value > todayIsoDate(now))
    return { ok: false, errors: { paymentDate: "Payment date cannot be in the future." } };
  return { ok: true, value };
}
