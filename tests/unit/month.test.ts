import { describe, expect, it } from "vitest";
import { currentPeriodMonth, formatPeriodMonth, todayIsoDate } from "@/lib/month";

describe("month definition (calendar month, server timezone)", () => {
  it("formats the current period as YYYY-MM", () => {
    expect(currentPeriodMonth(new Date(2026, 8, 18, 12))).toBe("2026-09");
    expect(currentPeriodMonth(new Date(2026, 0, 1))).toBe("2026-01");
  });

  // TC-023
  it("rolls over exactly at the month boundary", () => {
    expect(currentPeriodMonth(new Date(2026, 0, 31, 23, 59, 59, 999))).toBe("2026-01");
    expect(currentPeriodMonth(new Date(2026, 1, 1, 0, 0, 0, 0))).toBe("2026-02");
    expect(currentPeriodMonth(new Date(2026, 11, 31, 23, 59, 59, 999))).toBe("2026-12");
    expect(currentPeriodMonth(new Date(2027, 0, 1, 0, 0, 0, 0))).toBe("2027-01");
  });

  it("formats today's date and period labels", () => {
    expect(todayIsoDate(new Date(2026, 1, 3))).toBe("2026-02-03");
    expect(formatPeriodMonth("2026-09")).toBe("September 2026");
  });
});
