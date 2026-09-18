import { describe, expect, it } from "vitest";
import * as employees from "@/server/employees";
import * as payments from "@/server/payments";

// TC-020, TC-032: the data-access layer exposes create and read operations only.
describe("data-access surface", () => {
  it("offers no update or delete for employees", () => {
    expect(Object.keys(employees).sort()).toEqual(["createEmployee", "getEmployee", "listEmployees"]);
  });

  it("offers no update or delete for payments", () => {
    expect(Object.keys(payments).sort()).toEqual([
      "listPaymentsForEmployee",
      "paymentsForMonth",
      "recordPayment",
    ]);
  });
});
