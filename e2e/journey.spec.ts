import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addEmployee, loginAsAdmin, todayIso, uniqueName } from "./helpers";

function rowFor(page: Page, name: string) {
  return page.getByRole("row").filter({ has: page.getByRole("link", { name }) });
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test.describe("employees", () => {
  // TC-014
  test("adds an employee who then appears in the list", async ({ page }) => {
    const name = uniqueName("Asha");
    await addEmployee(page, { name, designation: "Accountant", salary: "4250.50" });
    const row = rowFor(page, name);
    await expect(row).toContainText("Accountant");
    await expect(row).toContainText("Apr 12, 1990");
    await expect(row).toContainText("4,250.50");
  });

  // TC-016, TC-017
  test("rejects invalid input and creates nothing", async ({ page }) => {
    await page.goto("/employees");
    const form = page.getByRole("region", { name: "Add employee" });
    const name = uniqueName("Invalid");
    await form.getByLabel("Name").fill(name);
    await form.getByLabel("Designation").fill("Clerk");
    await form.getByLabel("Date of birth").fill("1991-01-01");
    await form.getByLabel("Monthly salary").fill("0");
    await form.getByRole("button", { name: "Add employee" }).click();

    await expect(form.getByText("Salary must be greater than zero.")).toBeVisible();
    await expect(form.getByLabel("Name")).toHaveValue(name);
    await page.reload();
    await expect(page.getByText(name)).toHaveCount(0);
  });

  // TC-018, TC-019 (UI side)
  test("offers no edit or delete controls", async ({ page }) => {
    await addEmployee(page, { name: uniqueName("Immutable") });
    const table = page.getByRole("table");
    await expect(table.getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit|delete|remove/i })).toHaveCount(0);
  });
});

test.describe("monthly view & payment recording", () => {
  // TC-021, TC-026, TC-027, TC-037
  test("marks an employee paid with prefilled salary and required date", async ({ page }) => {
    const name = uniqueName("Ravi");
    await addEmployee(page, { name, salary: "5000" });

    await page.goto("/monthly");
    const row = rowFor(page, name);
    await expect(row.getByRole("cell", { name: "Unpaid", exact: true })).toBeVisible();

    await row.getByRole("button", { name: `Mark as paid for ${name}` }).click();
    const form = page.getByRole("form", { name: `Record payment for ${name}` });
    await expect(form.getByLabel("Amount")).toHaveValue("5000.00");
    await expect(form.getByLabel("Amount")).not.toBeEditable();
    // No payment method or notes are captured (PAY-5).
    const fieldNames = await form.locator("input[name], select, textarea").evaluateAll((els) =>
      els.map((el) => el.getAttribute("name")),
    );
    expect(fieldNames).toEqual(["employeeId", "paymentDate"]);

    // Saving without a date is blocked.
    await form.getByRole("button", { name: "Save payment" }).click();
    await expect(row.getByRole("cell", { name: "Unpaid", exact: true })).toBeVisible();

    await form.getByLabel("Payment date").fill(todayIso());
    await form.getByRole("button", { name: "Save payment" }).click();
    await expect(row.getByRole("cell", { name: "Paid", exact: true })).toBeVisible();
    await expect(row).toHaveAttribute("data-status", "paid");
    await expect(row.getByRole("button", { name: /Mark as paid/ })).toHaveCount(0);

    // The payment appears in the employee's history.
    await row.getByRole("link", { name }).click();
    const history = page.getByTestId("payment-history");
    await expect(history.getByRole("row")).toHaveCount(1);
    await expect(history).toContainText("5,000.00");
    await expect(page.getByRole("button", { name: /edit|delete|remove/i })).toHaveCount(0);
  });

  // TC-025
  test("shows no totals or summary metrics", async ({ page }) => {
    await addEmployee(page, { name: uniqueName("Meera") });
    await page.goto("/monthly");
    await expect(page.getByText(/total|sum|summary|outstanding|\d+\s+(paid|unpaid|employees)/i)).toHaveCount(0);
  });
});

test.describe("payment history", () => {
  // TC-038
  test("shows an empty state for an employee without payments", async ({ page }) => {
    const name = uniqueName("Empty");
    await addEmployee(page, { name });
    await page.getByRole("link", { name }).click();
    await expect(page.getByText("No payments recorded yet.")).toBeVisible();
  });

  // TC-018, TC-019, TC-041: no route edits or deletes employees or payments.
  test("ignores PUT, PATCH and DELETE even with a valid session", async ({ page }) => {
    const name = uniqueName("Locked");
    await addEmployee(page, { name, salary: "3000" });
    await page.goto("/monthly");
    const row = rowFor(page, name);
    await row.getByRole("button", { name: /Mark as paid/ }).click();
    await page.getByLabel("Payment date").fill(todayIso());
    await page.getByRole("button", { name: "Save payment" }).click();
    await expect(row).toHaveAttribute("data-status", "paid");
    const historyUrl = await row.getByRole("link", { name }).getAttribute("href");

    for (const method of ["PUT", "PATCH", "DELETE"]) {
      const response = await page.request.fetch(historyUrl!, {
        method,
        data: { salary: "1", amount: "1" },
        maxRedirects: 0,
      });
      expect(response.status(), method).toBe(405);
    }

    await page.goto(historyUrl!);
    await expect(page.getByText("3,000.00").first()).toBeVisible();
    await expect(page.getByTestId("payment-history").getByRole("row")).toHaveCount(1);
  });

  test("returns not found for an unknown employee", async ({ page }) => {
    const response = await page.goto("/employees/999999");
    expect(response?.status()).toBe(404);
  });
});

// TC-024, TC-035 and the accessibility gate: no critical/serious axe violations.
test.describe("accessibility", () => {
  test("core screens have no serious violations", async ({ page, context }) => {
    const name = uniqueName("A11y");
    await addEmployee(page, { name });
    for (const path of ["/monthly", "/employees"]) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));
      expect(serious, `${path}: ${serious.map((v) => v.id).join(", ")}`).toEqual([]);
    }
    await context.clearCookies();
    await page.goto("/login");
    const results = await new AxeBuilder({ page }).analyze();
    const loginSerious = results.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));
    expect(loginSerious, `/login: ${loginSerious.map((v) => v.id).join(", ")}`).toEqual([]);
  });
});
