// Restricts the SQLite database (and its journal files) to the app's OS user.
// Run automatically by `npm run db:migrate` / `npm start`.
import fs from "node:fs";
import path from "node:path";

function resolveDbPath() {
  let url = process.env.DATABASE_URL;
  if (!url && fs.existsSync(".env")) {
    const match = /^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m.exec(fs.readFileSync(".env", "utf8"));
    url = match?.[1];
  }
  if (!url?.startsWith("file:")) return null;
  const file = url.slice("file:".length).split("?")[0];
  // Prisma resolves relative SQLite paths from the schema directory.
  return path.isAbsolute(file) ? file : path.resolve("prisma", file);
}

if (process.platform === "win32") process.exit(0);

const dbPath = resolveDbPath();
if (!dbPath) {
  console.warn("secure-db: DATABASE_URL is not a SQLite file URL; skipping.");
  process.exit(0);
}

fs.chmodSync(path.dirname(dbPath), 0o700);
for (const file of [dbPath, `${dbPath}-journal`, `${dbPath}-wal`, `${dbPath}-shm`]) {
  if (fs.existsSync(file)) fs.chmodSync(file, 0o600);
}
console.log(`secure-db: restricted ${dbPath} to owner-only access.`);
