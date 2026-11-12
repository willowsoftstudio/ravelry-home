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
});
