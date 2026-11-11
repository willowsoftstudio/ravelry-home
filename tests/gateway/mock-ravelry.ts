import { NextRequest } from "next/server";
import { vi } from "vitest";

// A small stand-in for auth.ravelry.com and api.ravelry.com: issues tokens,
// refreshes, revokes (RFC 7009: revoking a refresh token also kills its access
// tokens), and answers 401 for expired or revoked access tokens.

export const AUTH = "https://auth.ravelry.test";
export const API = "https://api.ravelry.test";
export const APP = "https://app.test";

type Grant = { access: string; refresh: string; revoked: boolean; accessExpired: boolean };

export function mockRavelry(opts: { username?: string; rotateRefresh?: boolean } = {}) {
  const username = opts.username ?? "knitter";
  const grants: Grant[] = [];
  const calls: { method: string; url: string; body?: URLSearchParams; auth?: string | null }[] = [];
  let n = 0;
  const issue = (grant?: Grant) => {
    n += 1;
    if (grant) {
      grant.access = `access-${n}`;
      grant.accessExpired = false;
      if (opts.rotateRefresh) grant.refresh = `refresh-${n}`;
      return grant;
    }
    const g = { access: `access-${n}`, refresh: `refresh-${n}`, revoked: false, accessExpired: false };
    grants.push(g);
    return g;
  };
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input instanceof Request ? input.url : input));
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    const body = init.body instanceof URLSearchParams ? init.body : undefined;
    calls.push({ method, url: url.toString(), body, auth: headers.get("authorization") });

    if (url.origin === AUTH && url.pathname === "/oauth2/token") {
      const type = body?.get("grant_type");
      if (type === "authorization_code") {
        const g = issue();
        return json(200, { access_token: g.access, refresh_token: g.refresh, expires_in: 3600, scope: "offline_access forum-write message-write deliveries-read" });
      }
      const g = grants.find((x) => x.refresh === body?.get("refresh_token"));
      if (type === "refresh_token" && g && !g.revoked) {
        issue(g);
        return json(200, { access_token: g.access, refresh_token: g.refresh, expires_in: 3600 });
      }
      return json(400, { error: "invalid_grant" });
    }
    if (url.origin === AUTH && url.pathname === "/oauth2/revoke") {
      const t = body?.get("token");
      for (const g of grants) if (g.refresh === t || g.access === t) g.revoked = true;
      return new Response(null, { status: 200 });
    }
    if (url.origin === API) {
      const bearer = headers.get("authorization")?.replace(/^Bearer /, "");
      const g = grants.find((x) => x.access === bearer);
      if (!g || g.revoked || g.accessExpired) return json(401, { error: "unauthorized" });
      if (url.pathname === "/current_user.json") return json(200, { user: { id: 42, username } });
      if (url.pathname === `/projects/${username}/list.json`) {
        return json(200, { projects: [], paginator: { page: 1, page_count: 1, page_size: 50, results: 0, last_page: 1 } });
      }
      return json(404, {});
    }
    throw new Error(`unexpected outbound request: ${method} ${url}`);
  });

  return {
    fetchMock,
    calls,
    grants,
    callsTo: (path: string) => calls.filter((c) => new URL(c.url).pathname === path),
  };
}

export function stubAuthEnv(overrides: Record<string, string> = {}) {
  const env = {
    SESSION_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
    RAVELRY_CLIENT_ID: "client-123",
    RAVELRY_CLIENT_SECRET: "secret-456",
    RAVELRY_AUTH_BASE: AUTH,
    RAVELRY_API_BASE: API,
    APP_URL: APP,
    RAVELRY_REDIRECT_URI: "",
    BETA_ALLOWLIST: "knitter, Friend",
    ...overrides,
  };
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
}

export function request(path: string, init: { method?: string; cookies?: Record<string, string>; headers?: Record<string, string> } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookies) headers.set("cookie", Object.entries(init.cookies).map(([k, v]) => `${k}=${v}`).join("; "));
  return new NextRequest(`${APP}${path}`, { method: init.method ?? "GET", headers });
}

/** Parse Set-Cookie headers into name → { value, attributes }. */
export function setCookies(res: Response) {
  const out: Record<string, { value: string; attrs: string[] }> = {};
  for (const raw of res.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
    const i = pair.indexOf("=");
    out[pair.slice(0, i)] = { value: decodeURIComponent(pair.slice(i + 1)), attrs: attrs.map((a) => a.toLowerCase()) };
  }
  return out;
}

/** Run the real sign-in + callback routes and return the sealed session cookie. */
export async function signIn() {
  const { GET: signin } = await import("@/app/api/auth/signin/route");
  const { GET: callback } = await import("@/app/api/auth/callback/route");
  const start = await signin(request("/api/auth/signin?returnTo=/me"));
  const location = new URL(start.headers.get("location")!);
  const oauth = setCookies(start)["__Host-oauth"].value;
  const res = await callback(
    request(`/api/auth/callback?code=abc&state=${location.searchParams.get("state")}`, { cookies: { "__Host-oauth": oauth } }),
  );
  return { res, start, location, sid: setCookies(res)["__Host-sid"]?.value };
}
