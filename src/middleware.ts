import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST"]);

// First line of defence: anything without a validly signed cookie goes to /login.
// Pages and actions additionally verify the session exists server-side (see server/auth.ts).
export async function middleware(request: NextRequest) {
  // The app is create/read only; no route accepts PUT, PATCH or DELETE (EMP-3, EMP-4, HIST-3).
  if (!ALLOWED_METHODS.has(request.method)) {
    return new NextResponse("Method Not Allowed", {
      status: 405,
      headers: { Allow: [...ALLOWED_METHODS].join(", ") },
    });
  }

  // The login page is public; server actions posted to it still check the session themselves.
  if (request.nextUrl.pathname === "/login") return NextResponse.next();

  const sessionId = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (sessionId) return NextResponse.next();

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);
  if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
