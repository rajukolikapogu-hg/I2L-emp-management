import path from "node:path";
import os from "node:os";
import { defineConfig } from "vitest/config";

// Integration tests run against a disposable SQLite file per test run.
// Set on the main process so global setup and test workers share it.
const testDbPath = path.join(os.tmpdir(), `emp-management-test-${process.pid}.db`);
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-0123";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside a React Server Components bundle.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
  },
});
