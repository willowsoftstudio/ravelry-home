import { afterEach, describe, expect, it, vi } from "vitest";
import { mockRavelry, signIn, stubAuthEnv } from "./mock-ravelry";

// ISA ISC-84: redirect_uri comes from RAVELRY_REDIRECT_URI, or APP_URL + /api/auth/callback.

describe("configurable redirect URI", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  for (const [label, env, expected] of [
    ["set", { RAVELRY_REDIRECT_URI: "https://example.test/cb" }, "https://example.test/cb"],
    ["unset", { RAVELRY_REDIRECT_URI: "" }, "https://app.test/api/auth/callback"],
  ] as const) {
    it(`sends the same redirect_uri on authorize and token exchange (${label})`, async () => {
      stubAuthEnv(env);
      const ravelry = mockRavelry();
      vi.stubGlobal("fetch", ravelry.fetchMock);
      const { location } = await signIn();
      expect(location.searchParams.get("redirect_uri")).toBe(expected);
      const exchange = ravelry.callsTo("/oauth2/token")[0];
      expect(exchange.body?.get("redirect_uri")).toBe(expected);
    });
  }

  it("requests the default scopes, or RAVELRY_SCOPES when set", async () => {
    stubAuthEnv();
    vi.stubGlobal("fetch", mockRavelry().fetchMock);
    expect((await signIn()).location.searchParams.get("scope")).toBe("offline_access forum-write message-write deliveries-read");
    vi.stubEnv("RAVELRY_SCOPES", "offline_access");
    expect((await signIn()).location.searchParams.get("scope")).toBe("offline_access");
  });

  it("OAuth 2.0 mode: www endpoints, no PKCE, the 'offline' scope", async () => {
    stubAuthEnv({ RAVELRY_OAUTH_VERSION: "2.0" });
    const ravelry = mockRavelry();
    vi.stubGlobal("fetch", ravelry.fetchMock);
    const { location, res } = await signIn();
    expect(res.status).toBe(303); // signed in against the mock
    expect(location.searchParams.get("code_challenge")).toBeNull();
    expect(location.searchParams.get("code_challenge_method")).toBeNull();
    expect(location.searchParams.get("scope")).toBe("offline forum-write message-write deliveries-read");
    expect(ravelry.callsTo("/oauth2/token")[0].body?.has("code_verifier")).toBe(false);
  });

  it("OAuth 2.0 mode defaults to www.ravelry.com when no auth base is set", async () => {
    stubAuthEnv({ RAVELRY_OAUTH_VERSION: "2.0", RAVELRY_AUTH_BASE: "" });
    vi.stubGlobal("fetch", mockRavelry().fetchMock);
    const { GET } = await import("@/app/api/auth/signin/route");
    const { request } = await import("./mock-ravelry");
    const res = await GET(request("/api/auth/signin"));
    expect(res.headers.get("location")).toMatch(/^https:\/\/www\.ravelry\.com\/oauth2\/auth\?/);
  });

  it("OAuth 2.1 stays the default: auth.ravelry.com with PKCE", async () => {
    stubAuthEnv({ RAVELRY_AUTH_BASE: "" });
    vi.stubGlobal("fetch", mockRavelry().fetchMock);
    const { GET } = await import("@/app/api/auth/signin/route");
    const { request } = await import("./mock-ravelry");
    const loc = new URL((await GET(request("/api/auth/signin"))).headers.get("location")!);
    expect(loc.origin).toBe("https://auth.ravelry.com");
    expect(loc.searchParams.get("code_challenge_method")).toBe("S256");
  });
});
