import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP, mockRavelry, request, setCookies, signIn, stubAuthEnv } from "./mock-ravelry";

// ISA ISC-65: after sign-out, replaying the old cookie gets 401, because the
// refresh token was revoked at Ravelry (the cookie itself cannot be recalled).

describe("sign-out", () => {
  let ravelry: ReturnType<typeof mockRavelry>;
  beforeEach(() => {
    stubAuthEnv();
    ravelry = mockRavelry();
    vi.stubGlobal("fetch", ravelry.fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("revokes the refresh token, clears the cookie, and a replayed cookie gets 401", async () => {
    const { sid } = await signIn();
    const { POST } = await import("@/app/api/auth/signout/route");
    const out = await POST(request("/api/auth/signout", { method: "POST", cookies: { "__Host-sid": sid! }, headers: { origin: APP } }));

    expect(out.status).toBe(303);
    expect(setCookies(out)["__Host-sid"].attrs).toContain("max-age=0");
    const revokes = ravelry.callsTo("/oauth2/revoke");
    expect(revokes).toHaveLength(1);
    expect(revokes[0].body?.get("token")).toBe(ravelry.grants[0].refresh);
    expect(revokes[0].body?.get("token_type_hint")).toBe("refresh_token");

    const { GET } = await import("@/app/api/me/projects/route");
    const replay = await GET(request("/api/me/projects", { cookies: { "__Host-sid": sid! } }));
    expect(replay.status).toBe(401);
  });

  it("refuses a cross-site sign-out", async () => {
    const { sid } = await signIn();
    const { POST } = await import("@/app/api/auth/signout/route");
    const res = await POST(request("/api/auth/signout", { method: "POST", cookies: { "__Host-sid": sid! }, headers: { origin: "https://evil.test" } }));
    expect(res.status).toBe(403);
    expect(ravelry.callsTo("/oauth2/revoke")).toHaveLength(0);
  });
});
