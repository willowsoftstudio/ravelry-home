import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { appUrl, isAllowlisted } from "@/lib/auth/config";
import { exchangeCode, revokeToken } from "@/lib/auth/oauth";
import { setSessionCookie } from "@/lib/auth/session";
import { ravelryGet } from "@/lib/ravelry/client";
import { baseCookie, OAUTH_COOKIE, OAUTH_PURPOSE, type OAuthState, type Session } from "@/lib/session/cookies";
import { unseal } from "@/lib/session/seal";

type CurrentUser = { user: { id: number; username: string } };

function finish(res: NextResponse): NextResponse {
  res.cookies.set(OAUTH_COOKIE, "", { ...baseCookie, maxAge: 0 }); // single use
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

const failed = (reason: string) =>
  finish(NextResponse.redirect(`${appUrl()}/?signin=${encodeURIComponent(reason)}`, 303));

// Completes sign-in: checks state, exchanges the code with the PKCE verifier,
// checks the beta allowlist (ISC-18), then seals the session cookie (ISC-3).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const pending = unseal<OAuthState>(request.cookies.get(OAUTH_COOKIE)?.value, OAUTH_PURPOSE);
  if (q.get("error")) return failed(q.get("error") === "access_denied" ? "cancelled" : "error");
  const code = q.get("code");
  if (!pending || !code || q.get("state") !== pending.state || pending.exp < Date.now()) {
    return failed("expired");
  }

  let tokens;
  try {
    tokens = await exchangeCode(code, pending.verifier);
  } catch {
    return failed("error");
  }

  let me: CurrentUser["user"];
  try {
    me = (await ravelryGet<CurrentUser>("/current_user.json", {}, { kind: "bearer", accessToken: tokens.accessToken })).user;
  } catch {
    return failed("error");
  }

  if (!isAllowlisted(me.username)) {
    if (tokens.refreshToken) await revokeToken(tokens.refreshToken, "refresh_token");
    else await revokeToken(tokens.accessToken, "access_token");
    const res = NextResponse.json(
      { error: "not_on_beta_allowlist", message: "This Ravelry account is not part of the private beta." },
      { status: 403 },
    );
    return finish(res);
  }

  const session: Session = {
    username: me.username,
    userId: me.id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    scopes: tokens.scopes,
    issuedAt: Date.now(),
  };
  const res = NextResponse.redirect(`${appUrl()}${pending.returnTo}`, 303);
  setSessionCookie(res, session);
  return finish(res);
}
