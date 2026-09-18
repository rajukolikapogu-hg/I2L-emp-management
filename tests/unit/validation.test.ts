import { describe, expect, it } from "vitest";
import { validateEmployeeInput, validatePaymentDate } from "@/lib/validation";

const NOW = new Date(2026, 8, 18, 12);
const valid = { name: "Asha Rao", designation: "Engineer", dateOfBirth: "1990-04-12", salary: "5000" };

describe("validateEmployeeInput (EMP-2)", () => {
  it("accepts a complete employee with a positive salary", () => {
    const result = validateEmployeeInput(valid, NOW);
    expect(result).toEqual({
      ok: true,
      value: { name: "Asha Rao", designation: "Engineer", dateOfBirth: "1990-04-12", salaryCents: 500000 },
    });
  });

  it("accepts fractional salaries with up to 2 decimals", () => {
    const result = validateEmployeeInput({ ...valid, salary: "4999.99" }, NOW);
    expect(result.ok && result.value.salaryCents).toBe(499999);
  });

  // TC-016
  it.each(["name", "designation", "dateOfBirth", "salary"] as const)(
    "rejects a missing %s",
    (field) => {
      const result = validateEmployeeInput({ ...valid, [field]: "  " }, NOW);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.errors[field]).toBeTruthy();
    },
  );

  it("rejects non-string input as missing", () => {
    const result = validateEmployeeInput({ ...valid, name: null }, NOW);
    expect(!result.ok && result.errors.name).toBe("Name is required.");
  });

  // TC-017
  it.each(["0", "-100", "abc", "0.00", "12.345"])("rejects salary %j", (salary) => {
    const result = validateEmployeeInput({ ...valid, salary }, NOW);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.salary).toBeTruthy();
  });

  it("rejects invalid or future dates of birth", () => {
    for (const dateOfBirth of ["1990-02-30", "not-a-date", "2026-09-18", "2030-01-01"]) {
      expect(validateEmployeeInput({ ...valid, dateOfBirth }, NOW).ok).toBe(false);
    }
  });
});

describe("validatePaymentDate (PAY-2)", () => {
  it("requires a date", () => {
    expect(validatePaymentDate("", NOW)).toEqual({
      ok: false,
      errors: { paymentDate: "Payment date is required." },
    });
    expect(validatePaymentDate(null, NOW).ok).toBe(false);
  });

  it("accepts today and past dates, rejects future or invalid ones", () => {
    expect(validatePaymentDate("2026-09-18", NOW)).toEqual({ ok: true, value: "2026-09-18" });
    expect(validatePaymentDate("2026-09-01", NOW).ok).toBe(true);
    expect(validatePaymentDate("2026-09-19", NOW).ok).toBe(false);
    expect(validatePaymentDate("2026-13-01", NOW).ok).toBe(false);
  });
});
