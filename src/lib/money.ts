// Salaries are stored as integer minor units (cents) so values round-trip exactly.

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
export const MAX_SALARY_CENTS = 100_000_000_00; // 100 million per month is a sanity ceiling.

/** Parses a user-entered amount like "5000" or "5000.50" into cents; null if invalid. */
export function parseAmountToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Plain decimal string (no grouping) suitable for form inputs. */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
