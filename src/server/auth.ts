import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";
import { isSessionActive } from "./sessions";

/** The id of the current valid session, or null. */
export async function currentSessionId(): Promise<string | null> {
  const store = await cookies();
  const sessionId = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!sessionId) return null;
  return (await isSessionActive(sessionId)) ? sessionId : null;
}

/**
 * Server-side gate for every protected page and mutating action. The UI is never
 * the only guard: each action calls this before touching data (AUTH-3).
 */
export async function requireAdmin(): Promise<void> {
  if (!(await currentSessionId())) redirect("/login");
}
