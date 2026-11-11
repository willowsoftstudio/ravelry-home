import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockRavelry, request, setCookies, signIn, stubAuthEnv } from "./mock-ravelry";
import { readSession } from "@/lib/auth/session";
import { seal } from "@/lib/session/seal";

// ISA ISC-20: an expired access token with a valid refresh token gets 200 after
// a server-side refresh, with 0 redirects to www.ravelry.com.

describe("token refresh on /api/me/*", () => {
  let ravelry: ReturnType<typeof mockRavelry>;
  beforeEach(() => {
    stubAuthEnv();
    ravelry = mockRavelry({ rotateRefresh: true });
    vi.stubGlobal("fetch", ravelry.fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("refreshes an access token that has expired, then answers 200 with a resealed cookie", async () => {
    const { sid } = await signIn();
    const session = readSession(sid)!;
    const expired = seal({ ...session, expiresAt: Date.now() - 1000 }, "session");
    ravelry.grants[0].accessExpired = true;

    const { GET } = await import("@/app/api/me/projects/route");
    const res = await GET(request("/api/me/projects", { cookies: { "__Host-sid": expired } }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(ravelry.callsTo("/oauth2/token").map((c) => c.body?.get("grant_type"))).toEqual(["authorization_code", "refresh_token"]);
    const next = readSession(setCookies(res)["__Host-sid"].value)!;
    expect(next.accessToken).not.toBe(session.accessToken);
    expect(next.refreshToken).not.toBe(session.refreshToken); // rotation is stored
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("refreshes once when Ravelry answers 401 before the recorded expiry", async () => {
    const { sid } = await signIn();
    ravelry.grants[0].accessExpired = true;
    const { GET } = await import("@/app/api/me/projects/route");
    const res = await GET(request("/api/me/projects", { cookies: { "__Host-sid": sid! } }));
    expect(res.status).toBe(200);
    expect(ravelry.callsTo("/oauth2/token")).toHaveLength(2);
  });

  it("answers 401 and clears the cookie when the refresh token is no longer valid", async () => {
    const { sid } = await signIn();
    ravelry.grants[0].revoked = true;
    const { GET } = await import("@/app/api/me/projects/route");
    const res = await GET(request("/api/me/projects", { cookies: { "__Host-sid": sid! } }));
    expect(res.status).toBe(401);
    expect(setCookies(res)["__Host-sid"].attrs).toContain("max-age=0");
  });

  it("keeps the rotated refresh token even when Ravelry then fails the request", async () => {
    const { sid } = await signIn();
    const session = readSession(sid)!;
    const expired = seal({ ...session, expiresAt: Date.now() - 1000 }, "session");
    const realFetch = ravelry.fetchMock.getMockImplementation()!;
    ravelry.fetchMock.mockImplementation(async (input, init) => {
      if (String(input).includes("/projects/")) return new Response("{}", { status: 503 });
      return realFetch(input, init);
    });
    const { GET } = await import("@/app/api/me/projects/route");
    const res = await GET(request("/api/me/projects", { cookies: { "__Host-sid": expired } }));
    expect(res.status).toBe(503);
    const next = readSession(setCookies(res)["__Host-sid"]?.value);
    expect(next?.refreshToken).toBe(ravelry.grants[0].refresh);
    expect(next?.refreshToken).not.toBe(session.refreshToken);
  });

  it("never sends the user to www.ravelry.com during a refresh", async () => {
    const { sid } = await signIn();
    ravelry.grants[0].accessExpired = true;
    const { GET } = await import("@/app/api/me/projects/route");
    await GET(request("/api/me/projects", { cookies: { "__Host-sid": sid! } }));
    expect(ravelry.calls.some((c) => new URL(c.url).host === "www.ravelry.com")).toBe(false);
  });
});
