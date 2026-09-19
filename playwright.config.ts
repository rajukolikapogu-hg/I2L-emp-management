import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const e2eDb = path.resolve(__dirname, "data", "e2e.db");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `rm -f ${e2eDb} ${e2eDb}-journal && npx prisma migrate deploy && npx next build && npx next start -p ${PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/login`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: `file:${e2eDb}`,
      SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-012345",
      COOKIE_SECURE: "false",
    },
  },
});
