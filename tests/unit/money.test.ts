import { describe, expect, it } from "vitest";
import { centsToInputValue, formatCents, parseAmountToCents } from "@/lib/money";

describe("money", () => {
  it("parses amounts to exact cents", () => {
    expect(parseAmountToCents("5000")).toBe(500000);
    expect(parseAmountToCents("5000.5")).toBe(500050);
    expect(parseAmountToCents(" 0.01 ")).toBe(1);
  });

  it("rejects malformed amounts", () => {
    for (const bad of ["", "abc", "-100", "1e3", "10.123", "1,000", "."]) {
      expect(parseAmountToCents(bad)).toBeNull();
    }
  });

  it("formats cents for display and inputs", () => {
    expect(formatCents(123456789)).toBe("1,234,567.89");
    expect(centsToInputValue(500000)).toBe("5000.00");
  });
});
