import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockRavelry, request, setCookies, signIn, stubAuthEnv } from "./mock-ravelry";
import { readSession } from "@/lib/auth/session";
import { seal } from "@/lib/session/seal";
import { proxy } from "@/proxy";

// ISC-20 for pages: /me renders in Server Components, which can't set cookies, so
// src/proxy.ts refreshes an expiring token first and hands the page the new cookie.

describe("proxy token refresh for /me", () => {
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

  const forwardedSid = (res: Response) =>
    /__Host-sid=([^;]+)/.exec(decodeURIComponent(res.headers.get("x-middleware-request-cookie") ?? ""))?.[1];

  it("refreshes an expiring token, sets the new cookie, and forwards it to the page", async () => {
    const { sid } = await signIn();
    const session = readSession(sid)!;
    const expired = seal({ ...session, expiresAt: Date.now() - 1000 }, "session");

    const res = await proxy(request("/me", { cookies: { "__Host-sid": expired } }));
    const set = readSession(setCookies(res)["__Host-sid"].value)!;
    expect(set.accessToken).not.toBe(session.accessToken);
    expect(set.refreshToken).not.toBe(session.refreshToken); // rotation is kept
    expect(readSession(forwardedSid(res))?.accessToken).toBe(set.accessToken);
    expect(res.headers.get("location")).toBeNull();
  });

  it("leaves a fresh session alone", async () => {
    const { sid } = await signIn();
    const res = await proxy(request("/me", { cookies: { "__Host-sid": sid! } }));
    expect(setCookies(res)["__Host-sid"]).toBeUndefined();
    expect(ravelry.callsTo("/oauth2/token")).toHaveLength(1); // only the sign-in exchange
  });

  it("clears the session when the refresh token is no longer valid", async () => {
    const { sid } = await signIn();
    const session = readSession(sid)!;
    ravelry.grants[0].revoked = true;
    const res = await proxy(request("/me", { cookies: { "__Host-sid": seal({ ...session, expiresAt: 0 }, "session") } }));
    expect(setCookies(res)["__Host-sid"].attrs).toContain("max-age=0");
    expect(forwardedSid(res)).toBeUndefined();
  });
});
