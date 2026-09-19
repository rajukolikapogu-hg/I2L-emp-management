// Runtime configuration that must fail closed. Read lazily (not at import time) so
// `next build`, which also runs with NODE_ENV=production, does not need deploy settings.

/**
 * Whether the session cookie gets the `Secure` flag. In production COOKIE_SECURE must be
 * set explicitly to "true" or "false"; a missing or mistyped value is a startup error
 * rather than a silent downgrade to an insecure cookie.
 */
export function cookieSecure(): boolean {
  const value = process.env.COOKIE_SECURE;
  if (value === "true") return true;
  if (value === "false") return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `COOKIE_SECURE must be "true" or "false" in production (got ${value === undefined ? "nothing" : JSON.stringify(value)}).`,
    );
  }
  return false;
}

/** Throws if any required production setting is missing or invalid. */
export function validateConfig(): void {
  cookieSecure();
}
