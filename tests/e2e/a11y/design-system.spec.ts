import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// ISA ISC-14: 0 axe violations of any impact on /design-system, light and dark.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const scheme of ["light", "dark"] as const) {
  test(`/design-system has 0 axe violations (${scheme} OS preference)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("/design-system");
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary).toEqual([]);
  });
}

test("the open modal has 0 axe violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system");
  await page.locator('[data-theme-panel="light"]').getByRole("button", { name: "Open modal" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
