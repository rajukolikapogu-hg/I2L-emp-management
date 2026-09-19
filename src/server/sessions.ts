import "server-only";
import { prisma } from "@/lib/db";
import { newSessionId, SESSION_TTL_SECONDS } from "@/lib/session-token";

// Sessions are stored server-side so that logout truly revokes a cookie:
// a replayed cookie from before logout is rejected (AUTH-3, AUTH-4).

export async function createSession(now: Date = new Date()): Promise<string> {
  const id = newSessionId();
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.session.create({
      data: { id, expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000) },
    }),
  ]);
  return id;
}

export async function isSessionActive(id: string, now: Date = new Date()): Promise<boolean> {
  const session = await prisma.session.findUnique({ where: { id } });
  return session !== null && session.expiresAt > now;
}

export async function deleteSession(id: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id } });
}
