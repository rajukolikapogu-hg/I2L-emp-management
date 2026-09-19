import { expect, test } from "@playwright/test";
import { addEmployee, login, loginAsAdmin, SESSION_COOKIE, uniqueName } from "./helpers";

test.describe("authentication & session", () => {
  // TC-009
  test("redirects unauthenticated requests for protected pages to login", async ({ page }) => {
    for (const path of ["/", "/monthly", "/employees", "/employees/1"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  // TC-006, TC-007, TC-008
  test("rejects wrong credentials with one non-specific message", async ({ page, context }) => {
    await login(page, "eadmin", "wrong");
    // Next.js renders its own empty route-announcer alert, so match on content.
    const alert = page.getByRole("alert").filter({ hasText: /\S/ });
    await expect(alert).toHaveText("Invalid username or password.");

    await login(page, "admin", "epassword");
    await expect(alert).toHaveText("Invalid username or password.");

    await expect(page).toHaveURL(/\/login$/);
    expect((await context.cookies()).find((c) => c.name === SESSION_COOKIE)).toBeUndefined();
  });

  // TC-004, TC-005
  test("sets a signed HTTP-only session cookie on successful login", async ({ page, context }) => {
    await loginAsAdmin(page);
    const cookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.value).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(await page.evaluate(() => document.cookie)).not.toContain(SESSION_COOKIE);
  });

  // TC-011
  test("rejects a tampered session cookie", async ({ page, context }) => {
    await loginAsAdmin(page);
    const cookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE)!;
    const [id, sig] = cookie.value.split(".");
    const tampered = `${id.slice(0, -1)}${id.endsWith("A") ? "B" : "A"}.${sig}`;
    await context.clearCookies();
    await context.addCookies([{ ...cookie, value: tampered }]);

    await page.goto("/monthly");
    await expect(page).toHaveURL(/\/login$/);
  });

  // TC-012, TC-013
  test("logout clears the cookie and a replayed old cookie is refused", async ({ page, context }) => {
    await loginAsAdmin(page);
    const oldCookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE)!;

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect((await context.cookies()).find((c) => c.name === SESSION_COOKIE)).toBeUndefined();

    await context.addCookies([oldCookie]);
    await page.goto("/monthly");
    await expect(page).toHaveURL(/\/login$/);
  });

  // TC-010: the server is the gate, not the UI. Replay a real server-action request
  // without a cookie, both on its own route and via the unguarded /login route.
  test("rejects mutating actions without a valid session", async ({ page, playwright, baseURL }) => {
    await loginAsAdmin(page);
    const name = uniqueName("Captured");
    const requestPromise = page.waitForRequest(
      (r) => r.method() === "POST" && r.headers()["next-action"] !== undefined,
    );
    await addEmployee(page, { name });
    const captured = await requestPromise;
    const headers = captured.headers();
    const body = captured.postDataBuffer()!;
    const replayName = uniqueName("Replayed");
    const replayBody = Buffer.from(body.toString("latin1").replace(name, replayName), "latin1");

    const anonymous = await playwright.request.newContext({ baseURL });
    for (const path of ["/employees", "/login"]) {
      const response = await anonymous.post(path, {
        headers: {
          "content-type": headers["content-type"],
          "next-action": headers["next-action"],
        },
        data: replayBody,
        maxRedirects: 0,
      });
      expect(response.status(), `POST ${path}`).not.toBe(200);
    }
    await anonymous.dispose();

    await page.goto("/employees");
    await expect(page.getByRole("link", { name })).toBeVisible();
    await expect(page.getByText(replayName)).toHaveCount(0);
  });
});
