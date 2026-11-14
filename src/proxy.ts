import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, readSession, refreshed, REFRESH_EARLY_MS, SESSION_PURPOSE, setSessionCookie } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/session/cookies";
import { seal } from "@/lib/session/seal";

// Token refresh for signed-in pages (ISC-20, architecture: Sessions). Server
// Components can't set cookies, so a /me page that refreshed an expired token there
// could never save the new one (and a rotated refresh token would be lost). This
// runs first: when the access token is about to expire it refreshes, puts the
// resealed cookie on the request the page reads, and sets it on the response.
// /api/me/* refreshes in withSession instead.

export async function proxy(request: NextRequest) {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session || session.expiresAt - REFRESH_EARLY_MS >= Date.now()) return NextResponse.next();

  const next = await refreshed(session);
  if (!next) {
    // Refresh failed (revoked or expired): drop the session so the page shows sign-in.
    request.cookies.delete(SESSION_COOKIE);
    const res = NextResponse.next({ request: { headers: request.headers } });
    clearSessionCookie(res);
    return res;
  }

  request.cookies.set(SESSION_COOKIE, seal(next, SESSION_PURPOSE));
  const res = NextResponse.next({ request: { headers: request.headers } });
  setSessionCookie(res, next);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/me", "/me/:path*"],
};
