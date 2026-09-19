import { createHash, timingSafeEqual } from "node:crypto";

// The single admin credential pair is fixed by design (AUTH-1).
// See docs/OPERATIONS.md for the deployment restrictions this implies.
const ADMIN_USERNAME = "eadmin";
const ADMIN_PASSWORD = "epassword";

/** One generic message for every failure so it never reveals which field was wrong (AUTH-5). */
export const LOGIN_FAILED_MESSAGE = "Invalid username or password.";

/**
 * Constant-time string comparison. Both sides are hashed to fixed-length SHA-256
 * digests first, so neither the content nor the length of the input leaks via timing.
 */
function safeEqual(input: unknown, expected: string): boolean {
  const actual = typeof input === "string" ? input : "";
  const a = createHash("sha256").update(actual, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b) && typeof input === "string";
}

export function checkAdminCredentials(username: unknown, password: unknown): boolean {
  // Evaluate both comparisons so timing does not reveal which field failed.
  const userOk = safeEqual(username, ADMIN_USERNAME);
  const passOk = safeEqual(password, ADMIN_PASSWORD);
  return userOk && passOk;
}
