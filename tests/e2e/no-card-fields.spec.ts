import { expect } from "@playwright/test";
import { ROUTES, routeTest } from "./routes";

// ISA ISC-7: no page collects payment card data.
const CARD_FIELDS =
  'input[autocomplete^="cc-"], input[name*="card" i], input[id*="card" i], input[name*="cvc" i], input[id*="cvc" i], input[name*="cvv" i], input[id*="cvv" i], input[name*="expir" i], input[id*="expir" i]';

for (const route of [ROUTES.patternPaid, ROUTES.library]) {
  routeTest("0 card inputs on", route, async ({ page }) => {
    const res = await page.goto(route.path);
    expect(res?.status()).not.toBe(404);
    await expect(page.locator(CARD_FIELDS)).toHaveCount(0);
  });
}
