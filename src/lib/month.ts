// A "month" is the calendar month in the server's local timezone, formatted YYYY-MM.
// All month logic lives here so that past-month recording can be added later
// without touching callers.

const pad = (n: number) => String(n).padStart(2, "0");

export function periodMonthOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function currentPeriodMonth(now: Date = new Date()): string {
  return periodMonthOf(now);
}

/** Today's calendar date in server timezone, formatted YYYY-MM-DD. */
export function todayIsoDate(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Human label for a YYYY-MM period, e.g. "September 2026". */
export function formatPeriodMonth(periodMonth: string): string {
  const [year, month] = periodMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
