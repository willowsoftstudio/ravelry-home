import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/auth/config";
import { revokeToken } from "@/lib/auth/oauth";
import { clearSessionCookie, readSession } from "@/lib/auth/session";
import { baseCookie, PDF_COOKIE, SESSION_COOKIE } from "@/lib/session/cookies";

// Signs out: revokes the refresh token at Ravelry (RFC 7009) so a copied cookie
// can no longer refresh, then clears the cookies (ISA ISC-65).
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(appUrl()).origin) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 });
  }
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session?.refreshToken) await revokeToken(session.refreshToken, "refresh_token");
  else if (session) await revokeToken(session.accessToken, "access_token");

  const res = NextResponse.redirect(`${appUrl()}/`, 303);
  clearSessionCookie(res);
  res.cookies.set(PDF_COOKIE, "", { ...baseCookie, maxAge: 0 });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
