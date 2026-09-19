import { execSync } from "node:child_process";
import fs from "node:fs";

// Applies the real migrations to a fresh, disposable SQLite file for this run.
export default function setup() {
  const url = process.env.DATABASE_URL!;
  const file = url.slice("file:".length);
  const cleanup = () => {
    for (const f of [file, `${file}-journal`]) fs.rmSync(f, { force: true });
  };
  cleanup();
  execSync("npx prisma migrate deploy", { stdio: "pipe", env: process.env });
  return cleanup;
}
