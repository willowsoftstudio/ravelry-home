import { expect, test } from "@playwright/test";

// ISA ISC-17: sign-in redirects to Ravelry's OAuth 2.1 authorize URL with state and PKCE.
test("sign-in redirects to Ravelry with state and an S256 code challenge", async ({ request }) => {
  const res = await request.get("/api/auth/signin", { maxRedirects: 0 });
  expect([302, 307]).toContain(res.status());
  const location = new URL(res.headers()["location"]);
  expect(`${location.origin}${location.pathname}`).toBe("https://auth.ravelry.com/oauth2/auth");
  expect(location.searchParams.get("state")?.length ?? 0).toBeGreaterThanOrEqual(32);
  expect(location.searchParams.get("code_challenge")?.length ?? 0).toBeGreaterThanOrEqual(43);
  expect(location.searchParams.get("code_challenge_method")).toBe("S256");
  expect(location.searchParams.get("scope")).toContain("offline_access");
  const setCookie = res.headers()["set-cookie"] ?? "";
  expect(setCookie).toMatch(/__Host-oauth=/);
  expect(setCookie.toLowerCase()).toMatch(/httponly/);
});
