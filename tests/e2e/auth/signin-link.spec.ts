import { expect, test } from "@playwright/test";

// The header sign-in control must be a plain link, not a client-side <Link>.
// The route redirects off-site to Ravelry, and a client navigation fetches an RSC
// payload first ("Failed to fetch RSC payload", then a second request).
// The request is stopped at our own route, so the test never contacts Ravelry.
test("clicking Sign in with Ravelry is one full-page navigation", async ({ page }) => {
  const seen: { navigation: boolean; rsc: boolean }[] = [];
  await page.route("**/api/auth/signin**", async (route) => {
    const req = route.request();
    seen.push({ navigation: req.isNavigationRequest(), rsc: "rsc" in req.headers() });
    await route.fulfill({ status: 200, contentType: "text/html", body: "<title>sign-in stub</title>" });
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in with Ravelry" }).click();
  await page.waitForURL("**/api/auth/signin");
  expect(seen).toEqual([{ navigation: true, rsc: false }]);
});
