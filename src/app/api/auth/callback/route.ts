import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { appUrl, isAllowlisted } from "@/lib/auth/config";
import { exchangeCode, revokeToken } from "@/lib/auth/oauth";
import { setSessionCookie } from "@/lib/auth/session";
import { ravelryGet } from "@/lib/ravelry/client";
import { baseCookie, OAUTH_COOKIE, OAUTH_PURPOSE, type OAuthState, type Session } from "@/lib/session/cookies";
import { unseal } from "@/lib/session/seal";

type CurrentUser = { user: { id: number; username: string } };

// Dev only: which step of the callback passed or failed. Never logs token values.
const devLog = (msg: string) => {
  if (process.env.NODE_ENV !== "production") console.info(`[auth] callback: ${msg}`);
};

function finish(res: NextResponse): NextResponse {
  res.cookies.set(OAUTH_COOKIE, "", { ...baseCookie, maxAge: 0 }); // single use
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

const failed = (reason: string, detail = "") => {
  devLog(`failed (${reason})${detail ? ` ${detail}` : ""}`);
  return finish(NextResponse.redirect(`${appUrl()}/?signin=${encodeURIComponent(reason)}`, 303));
};

// Completes sign-in: checks state, exchanges the code with the PKCE verifier,
// checks the beta allowlist (ISC-18), then seals the session cookie (ISC-3).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const pending = unseal<OAuthState>(request.cookies.get(OAUTH_COOKIE)?.value, OAUTH_PURPOSE);
  if (q.get("error")) return failed(q.get("error") === "access_denied" ? "cancelled" : "error", `Ravelry error=${q.get("error")}`);
  const code = q.get("code");
  if (!pending || !code || q.get("state") !== pending.state || pending.exp < Date.now()) {
    return failed("expired", `oauth cookie=${pending ? "ok" : "missing or unreadable"} code=${code ? "yes" : "no"} state match=${pending ? q.get("state") === pending.state : "n/a"}`);
  }

  let tokens;
  try {
    tokens = await exchangeCode(code, pending.verifier);
  } catch (err) {
    return failed("error", `token exchange: ${err instanceof Error ? err.message : "unknown"}`);
  }
  devLog(`token exchange ok (access ${tokens.accessToken.length} chars, refresh ${tokens.refreshToken ? `${tokens.refreshToken.length} chars` : "none"}, scopes "${tokens.scopes.join(" ")}")`);

  let me: CurrentUser["user"];
  try {
    me = (await ravelryGet<CurrentUser>("/current_user.json", {}, { kind: "bearer", accessToken: tokens.accessToken })).user;
  } catch (err) {
    return failed("error", `current_user: ${err instanceof Error ? err.message : "unknown"}`);
  }

  if (!isAllowlisted(me.username)) {
    devLog(`user "${me.username}" is not in BETA_ALLOWLIST`);
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
  const size = res.cookies.get("__Host-sid")?.value.length ?? 0;
  devLog(`signed in as "${me.username}"; session cookie ${size} bytes${size > 3800 ? " (TOO LARGE: browsers drop cookies over ~4 KB)" : ""}`);
  return finish(res);
}
