import { expect, test } from "@playwright/test";
import { ROUTES, routeTest } from "./routes";

// ISA ISC-8: private beta, nothing indexed.
const routes = [
  ROUTES.home, ROUTES.patterns, ROUTES.patternDetail, ROUTES.yarns, ROUTES.yarnDetail,
  ROUTES.community, ROUTES.me, ROUTES.library, ROUTES.designSystem,
];

for (const route of routes) {
  routeTest("X-Robots-Tag noindex on", route, async ({ request }) => {
    const res = await request.get(route.path, { maxRedirects: 0 });
    expect(res.status(), "route must exist, not 404").not.toBe(404);
    expect(res.headers()["x-robots-tag"] ?? "").toContain("noindex");
  });
}

test("robots.txt disallows everything", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  const lines = (await res.text()).split(/\r?\n/).map((l) => l.trim());
  expect(lines).toContain("Disallow: /");
});
