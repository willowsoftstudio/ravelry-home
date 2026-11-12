import { createCipheriv, hkdfSync, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";

// The header shows the signed-in user on every page, including a 404.
// Regression: the session check crashed while prerendering /_not-found, so the
// header showed "Sign in" again after a successful sign-in.
// The cookie is sealed exactly like src/lib/session/seal.ts (which can't be
// imported here: it is server-only), with the e2e SESSION_SECRET.

const E2E_SESSION_SECRET = "e2e-session-secret-0123456789abcdef0123456789";

function sealSession(payload: unknown): string {
  const key = Buffer.from(hkdfSync("sha256", E2E_SESSION_SECRET, "site-cookie-seal-v1", "session", 32));
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([Buffer.from([1]), nonce, body, cipher.getAuthTag()]).toString("base64url");
}

test.beforeEach(async ({ context, baseURL }) => {
  const now = Date.now();
  await context.addCookies([
    {
      name: "__Host-sid",
      value: sealSession({
        username: "e2e-user",
        userId: 1,
        accessToken: "e2e-access",
        refreshToken: "e2e-refresh",
        expiresAt: now + 3_600_000,
        scopes: ["offline_access"],
        issuedAt: now,
      }),
      // Chrome only accepts a Secure cookie for an https URL, but treats localhost as a
      // secure context and still sends it to the http://localhost e2e server.
      url: baseURL!.replace(/^http:/, "https:"),
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);
});

for (const path of ["/", "/design-system", "/a-page-that-does-not-exist"]) {
  test(`header shows the signed-in user on ${path}`, async ({ page }) => {
    await page.goto(path);
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "e2e-user" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign in with Ravelry" })).toHaveCount(0);
  });
}
