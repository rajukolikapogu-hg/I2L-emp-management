import { expect, type Page } from "@playwright/test";

export const SESSION_COOKIE = "emp_session";

export async function login(page: Page, username = "eadmin", password = "epassword") {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function loginAsAdmin(page: Page) {
  await login(page);
  await expect(page).toHaveURL(/\/monthly$/);
}

let counter = 0;
export function uniqueName(prefix: string) {
  counter += 1;
  return `${prefix} ${Date.now().toString(36)}${counter}`;
}

export async function addEmployee(
  page: Page,
  { name, designation = "Engineer", dateOfBirth = "1990-04-12", salary = "5000" }:
    { name: string; designation?: string; dateOfBirth?: string; salary?: string },
) {
  await page.goto("/employees");
  const form = page.getByRole("region", { name: "Add employee" });
  await form.getByLabel("Name").fill(name);
  await form.getByLabel("Designation").fill(designation);
  await form.getByLabel("Date of birth").fill(dateOfBirth);
  await form.getByLabel("Monthly salary").fill(salary);
  await form.getByRole("button", { name: "Add employee" }).click();
  await expect(form.getByRole("status")).toHaveText(`${name} was added.`);
}

export function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
