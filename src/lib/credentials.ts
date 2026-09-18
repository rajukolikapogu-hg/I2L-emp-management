// The single admin credential pair is fixed by design (AUTH-1).
// See docs/OPERATIONS.md for the deployment restrictions this implies.
const ADMIN_USERNAME = "eadmin";
const ADMIN_PASSWORD = "epassword";

/** One generic message for every failure so it never reveals which field was wrong (AUTH-5). */
export const LOGIN_FAILED_MESSAGE = "Invalid username or password.";

export function checkAdminCredentials(username: unknown, password: unknown): boolean {
  // Evaluate both comparisons so timing does not reveal which field failed.
  const userOk = username === ADMIN_USERNAME;
  const passOk = password === ADMIN_PASSWORD;
  return userOk && passOk;
}
