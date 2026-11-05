import { expect, test } from "@playwright/test";
import { ROUTES, routeTest } from "./routes";

// ISA ISC-82: the site name comes from one config value.
// Run with NEXT_PUBLIC_SITE_NAME=Testname; without it, the default is checked.
const DEFAULT_NAME = "Niddy";
const expected = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || DEFAULT_NAME;
const renamed = expected !== DEFAULT_NAME;

for (const route of [ROUTES.home, ROUTES.patterns, ROUTES.me]) {
  routeTest("name in header, footer and <title> on", route, async ({ page }) => {
    const res = await page.goto(route.path);
    expect(res?.status()).not.toBe(404);
    await expect(page.locator("header")).toContainText(expected);
    await expect(page.locator("footer")).toContainText(expected);
    await expect(page).toHaveTitle(new RegExp(expected));
    if (renamed) {
      await expect(page.locator("header")).not.toContainText(DEFAULT_NAME);
      await expect(page.locator("footer")).not.toContainText(DEFAULT_NAME);
      expect(await page.title()).not.toContain(DEFAULT_NAME);
    }
  });
}

test("web manifest name", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.name).toBe(expected);
  expect(manifest.short_name).toBe(expected);
});
