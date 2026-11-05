import { expect } from "@playwright/test";
import { ROUTES, routeTest } from "./routes";

// ISA ISC-5: every page's footer says the site is not affiliated with Ravelry.
const routes = [ROUTES.home, ROUTES.patterns, ROUTES.patternDetail, ROUTES.yarns, ROUTES.me];

for (const route of routes) {
  routeTest("footer notice on", route, async ({ page }) => {
    const res = await page.goto(route.path);
    expect(res?.status()).not.toBe(404);
    await expect(page.locator("footer")).toContainText("not affiliated with Ravelry");
  });
}
