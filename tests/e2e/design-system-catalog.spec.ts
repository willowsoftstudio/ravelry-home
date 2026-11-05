import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// ISA ISC-14: every component under "Component Specs" in MASTER.md has a
// rendered example on /design-system, in both theme panels.
const master = readFileSync(
  join(__dirname, "../../design-system/ravelry-companion-site/MASTER.md"),
  "utf8",
);

function componentNames(md: string): string[] {
  const start = md.indexOf("## Component Specs");
  if (start < 0) throw new Error("MASTER.md has no Component Specs section");
  const rest = md.slice(start + "## Component Specs".length);
  const end = rest.search(/^## /m);
  const section = end < 0 ? rest : rest.slice(0, end);
  return [...section.matchAll(/^### (.+)$/gm)].map((m) => m[1].trim());
}

test("renders every MASTER component in light and dark", async ({ page }) => {
  const names = componentNames(master);
  expect(names.length).toBeGreaterThanOrEqual(4);

  await page.goto("/design-system");
  for (const theme of ["light", "dark"]) {
    const panel = page.locator(`[data-theme-panel="${theme}"]`);
    await expect(panel).toBeVisible();
    for (const name of names) {
      const example = panel.locator(`[data-component="${name}"]`);
      await expect(example, `${name} in ${theme}`).toBeVisible();
      // A section heading alone is not an example: require rendered content.
      await expect(example.locator("button, input, [data-slot]").first()).toBeVisible();
    }
  }
});

test("the real modal opens and closes", async ({ page }) => {
  await page.goto("/design-system");
  const panel = page.locator('[data-theme-panel="light"]');
  await panel.getByRole("button", { name: "Open modal" }).click();
  const dialog = page.getByRole("dialog", { name: "Add to your queue?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});
