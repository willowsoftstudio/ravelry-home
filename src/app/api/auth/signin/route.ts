import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authorizeUrl, createPkce, createState } from "@/lib/auth/oauth";
import { baseCookie, OAUTH_COOKIE, OAUTH_MAX_AGE, OAUTH_PURPOSE, safeReturnTo, type OAuthState } from "@/lib/session/cookies";
import { seal } from "@/lib/session/seal";


// Starts Ravelry OAuth 2.1 sign-in with PKCE (ISA ISC-17).
export async function GET(request: NextRequest) {
  const state = createState();
  const { verifier, challenge } = createPkce();
  const payload: OAuthState = {
    state,
    verifier,
    returnTo: safeReturnTo(request.nextUrl.searchParams.get("returnTo")),
    exp: Date.now() + OAUTH_MAX_AGE * 1000,
  };
  const res = NextResponse.redirect(authorizeUrl(state, challenge), 307);
  res.cookies.set(OAUTH_COOKIE, seal(payload, OAUTH_PURPOSE), { ...baseCookie, maxAge: OAUTH_MAX_AGE });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
