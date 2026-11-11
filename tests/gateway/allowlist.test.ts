import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockRavelry, setCookies, signIn, stubAuthEnv } from "./mock-ravelry";

// ISA ISC-18: a username not on the allowlist gets 403, no session cookie, and
// its tokens are revoked so nothing is held on its behalf. Also ISC-3's cookie
// attributes for the allowlisted path.

describe("OAuth callback and the beta allowlist", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("username not on the allowlist", () => {
    let ravelry: ReturnType<typeof mockRavelry>;
    beforeEach(() => {
      stubAuthEnv();
      ravelry = mockRavelry({ username: "stranger" });
      vi.stubGlobal("fetch", ravelry.fetchMock);
    });

    it("responds 403 with no session cookie and revokes the tokens", async () => {
      const { res } = await signIn();
      expect(res.status).toBe(403);
      const cookies = setCookies(res);
      expect(cookies["__Host-sid"]).toBeUndefined();
      expect(cookies["__Host-oauth"].attrs).toContain("max-age=0");
      expect(ravelry.callsTo("/oauth2/revoke")).toHaveLength(1);
      expect(ravelry.grants.every((g) => g.revoked)).toBe(true);
    });
  });

  describe("username on the allowlist (case-insensitive)", () => {
    beforeEach(() => {
      stubAuthEnv({ BETA_ALLOWLIST: "Knitter" });
      vi.stubGlobal("fetch", mockRavelry({ username: "knitter" }).fetchMock);
    });

    it("sets an HttpOnly, Secure, SameSite=Lax session cookie and returns to the start page", async () => {
      const { res } = await signIn();
      expect(res.status).toBe(303);
      expect(res.headers.get("location")).toBe("https://app.test/me");
      const sid = setCookies(res)["__Host-sid"];
      expect(sid.value.length).toBeGreaterThan(50);
      expect(sid.attrs).toEqual(expect.arrayContaining(["httponly", "secure", "samesite=lax", "path=/"]));
      expect(sid.value).not.toMatch(/access-|refresh-/);
    });
  });

  describe("state checks", () => {
    beforeEach(() => {
      stubAuthEnv();
      vi.stubGlobal("fetch", mockRavelry().fetchMock);
    });

    it("rejects a callback whose state does not match the cookie", async () => {
      const { GET: signin } = await import("@/app/api/auth/signin/route");
      const { GET: callback } = await import("@/app/api/auth/callback/route");
      const { request } = await import("./mock-ravelry");
      const start = await signin(request("/api/auth/signin"));
      const oauth = setCookies(start)["__Host-oauth"].value;
      const res = await callback(request("/api/auth/callback?code=abc&state=forged", { cookies: { "__Host-oauth": oauth } }));
      expect(res.status).toBe(303);
      expect(res.headers.get("location")).toBe("https://app.test/?signin=expired");
      expect(setCookies(res)["__Host-sid"]).toBeUndefined();
    });

    it("never redirects off-site from returnTo", async () => {
      const { GET: signin } = await import("@/app/api/auth/signin/route");
      const { request } = await import("./mock-ravelry");
      const { unseal } = await import("@/lib/session/seal");
      for (const evil of ["//evil.test/x", "https://evil.test", "/\\evil.test"]) {
        const start = await signin(request(`/api/auth/signin?returnTo=${encodeURIComponent(evil)}`));
        const state = unseal<{ returnTo: string }>(setCookies(start)["__Host-oauth"].value, "oauth-state");
        expect(state?.returnTo).toBe("/me");
      }
    });
  });
});
