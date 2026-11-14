import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RavelryError } from "@/lib/ravelry/client";
import { errorResponse } from "@/lib/ravelry/route-errors";
import { baseCookie, SESSION_COOKIE, SESSION_MAX_AGE, type Session } from "@/lib/session/cookies";
import { seal, unseal } from "@/lib/session/seal";
import { isAllowlisted } from "./config";
import { refreshTokens } from "./oauth";

export const REFRESH_EARLY_MS = 60_000;
export const SESSION_PURPOSE = "session";

export function readSession(sealed: string | undefined): Session | null {
  const s = unseal<Session>(sealed, SESSION_PURPOSE);
  if (!s || typeof s.accessToken !== "string" || typeof s.username !== "string") return null;
  if (Date.now() - s.issuedAt > SESSION_MAX_AGE * 1000) return null;
  return s;
}

export function setSessionCookie(res: NextResponse, session: Session): void {
  const remaining = Math.max(1, Math.floor((session.issuedAt + SESSION_MAX_AGE * 1000 - Date.now()) / 1000));
  res.cookies.set(SESSION_COOKIE, seal(session, SESSION_PURPOSE), { ...baseCookie, maxAge: remaining });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { ...baseCookie, maxAge: 0 });
}

/** Exchange the refresh token for new tokens; null when that fails. */
export async function refreshed(session: Session): Promise<Session | null> {
  if (!session.refreshToken) return null;
  try {
    const t = await refreshTokens(session.refreshToken);
    return {
      ...session,
      accessToken: t.accessToken,
      // Keep the old refresh token if Ravelry does not rotate it.
      refreshToken: t.refreshToken ?? session.refreshToken,
      expiresAt: t.expiresAt,
      scopes: t.scopes.length ? t.scopes : session.scopes,
    };
  } catch {
    return null;
  }
}

const unauthorized = (clear: boolean) => {
  const res = NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (clear) clearSessionCookie(res);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
};

/**
 * Wrap a signed-in API route (/api/me/*). Anonymous or non-allowlisted callers get
 * 401/403 before any Ravelry call (ISC-38). The token is refreshed when it is about
 * to expire (ISC-20), and once more if Ravelry answers 401. Responses are never
 * cached at the edge (ISC-71).
 */
export function withSession<T>(
  handler: (session: Session, request: NextRequest) => Promise<T>,
): (request: NextRequest) => Promise<Response> {
  return async (request) => {
    let session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) return unauthorized(request.cookies.has(SESSION_COOKIE));
    if (!isAllowlisted(session.username)) {
      const res = NextResponse.json({ error: "forbidden" }, { status: 403 });
      res.headers.set("Cache-Control", "private, no-store");
      return res;
    }

    let resealed = false;
    // Every response after a refresh carries the resealed cookie, errors included:
    // if Ravelry rotates refresh tokens, the old one in the browser is now dead.
    const finish = (res: Response): Response => {
      const out = res instanceof NextResponse ? res : new NextResponse(res.body, res);
      out.headers.set("Cache-Control", "private, no-store");
      if (resealed && out.status !== 401) setSessionCookie(out, session!);
      return out;
    };

    if (session.expiresAt - REFRESH_EARLY_MS < Date.now()) {
      const next = await refreshed(session);
      if (!next) return unauthorized(true);
      session = next;
      resealed = true;
    }

    let data: T;
    try {
      data = await handler(session, request);
    } catch (err) {
      if (!(err instanceof RavelryError && err.status === 401)) return finish(errorResponse(err));
      const next = await refreshed(session);
      if (!next) return unauthorized(true);
      session = next;
      resealed = true;
      try {
        data = await handler(session, request);
      } catch (retryErr) {
        if (retryErr instanceof RavelryError && retryErr.status === 401) return unauthorized(true);
        return finish(errorResponse(retryErr));
      }
    }

    return finish(NextResponse.json(data));
  };
}
