import { test } from "@playwright/test";

// Every route the cross-cutting ISA criteria check. `built: false` routes are
// planned feature routes (F3–F6): their checks are registered as test.fixme so
// they show up as pending instead of passing against a 404. Flip `built` when
// the route ships; the criterion stays unchecked in the ISA until then.

export type SiteRoute = { path: string; built: boolean; feature?: string };

export const ROUTES = {
  home: { path: "/", built: true },
  designSystem: { path: "/design-system", built: true },
  patterns: { path: "/patterns", built: false, feature: "F3" },
  patternDetail: { path: "/patterns/fixture-free", built: false, feature: "F3" },
  patternPaid: { path: "/patterns/fixture-paid", built: false, feature: "F3/F6" },
  yarns: { path: "/yarns", built: false, feature: "F3" },
  yarnDetail: { path: "/yarns/fixture", built: false, feature: "F3" },
  me: { path: "/me", built: false, feature: "F4" },
  library: { path: "/me/library", built: false, feature: "F4/F6" },
  community: { path: "/community", built: false, feature: "F5" },
} satisfies Record<string, SiteRoute>;

/** Register `fn` as a test for a built route, or as a pending test for a planned one. */
export function routeTest(
  title: string,
  route: SiteRoute,
  fn: Parameters<typeof test>[2],
) {
  const name = `${title} ${route.path}`;
  if (route.built) test(name, fn);
  else test.fixme(`${name} (pending ${route.feature})`, fn);
}
