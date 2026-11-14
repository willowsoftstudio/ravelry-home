import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCounts, getList, itemPhoto } from "@/lib/ravelry/workspace";
import type { Session } from "@/lib/session/cookies";

// ISC-32: each /me tab's total is its list's paginator.results; photos follow the
// credit rule (own photos need none, others need copyright_holder).

const session: Session = { username: "knitter", userId: 42, accessToken: "t", expiresAt: Date.now() + 3_600_000, scopes: [], issuedAt: Date.now() };
const API = "https://api.ravelry.test";

const BODIES: Record<string, unknown> = {
  "/projects/knitter/list.json": {
    projects: [{ id: 1, name: "Sunday Cowl", permalink: "sunday-cowl", pattern_name: "Cowl", status_name: "In progress", progress: 40, first_photo: { user_id: 42, medium_url: "https://img.test/p.jpg" } }],
    paginator: { page: 1, page_count: 3, results: 61 },
  },
  "/people/knitter/queue/list.json": {
    queued_projects: [{ id: 9, pattern_id: 777, pattern_name: "Raglan", pattern_author_name: "Ann", best_photo: { user_id: 5, medium_url: "https://img.test/q.jpg" } }],
    paginator: { page: 1, page_count: 1, results: 1 },
  },
  "/people/knitter/stash/list.json": { stash: [], paginator: { results: 0 } },
  "/people/knitter/favorites/list.json": {
    favorites: [{ id: 3, type: "pattern", favorited: { id: 555, name: "Fave Hat", first_photo: { user_id: 8, copyright_holder: "designer8", medium_url: "https://img.test/f.jpg" } } }],
    paginator: { results: 12 },
  },
  "/people/knitter/library/search.json": { volumes: [{ id: 4, title: "Hat Book", author_name: "B", small_image_url: "https://img.test/v.jpg", pattern_id: 99 }], paginator: { results: 2 } },
};

describe("workspace lists", () => {
  let calls: URL[];
  beforeEach(() => {
    calls = [];
    vi.stubEnv("RAVELRY_API_BASE", API);
    vi.stubGlobal("fetch", vi.fn(async (input: URL | string) => {
      const url = new URL(String(input));
      calls.push(url);
      return Response.json(BODIES[url.pathname] ?? {}, { status: BODIES[url.pathname] ? 200 : 404 });
    }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("maps a page of projects and always sends page_size", async () => {
    const list = await getList(session, "projects", 2);
    expect(list).toMatchObject({ total: 61, pageCount: 3 });
    expect(list.items[0]).toMatchObject({ title: "Sunday Cowl", subtitle: "Cowl", meta: "In progress · 40%", href: "https://www.ravelry.com/projects/knitter/sunday-cowl" });
    expect(calls[0].searchParams.get("page")).toBe("2");
    expect(calls[0].searchParams.get("page_size")).toBe("24");
    expect(calls[0].searchParams.get("sort")).toBeNull();
  });

  it("links queued and favorited patterns to our pattern page", async () => {
    expect((await getList(session, "queue")).items[0]).toMatchObject({ title: "Raglan", subtitle: "Ann", href: "/patterns/777" });
    expect((await getList(session, "favorites")).items[0]).toMatchObject({ title: "Fave Hat", meta: "Pattern", href: "/patterns/555" });
    expect((await getList(session, "library")).items[0]).toMatchObject({ title: "Hat Book", href: "/patterns/99" });
  });

  it("counts every tab from its paginator", async () => {
    expect(await getCounts(session)).toEqual({ projects: 61, queue: 1, stash: 0, favorites: 12, library: 2 });
  });

  it("reports a failed list as null instead of failing the page", async () => {
    BODIES["/people/knitter/stash/list.json"] = undefined;
    expect((await getCounts(session)).stash).toBeNull();
    BODIES["/people/knitter/stash/list.json"] = { stash: [], paginator: { results: 0 } };
  });
});

describe("itemPhoto", () => {
  const url = { medium_url: "https://img.test/a.jpg" };
  it("shows the viewer's own photo without a credit", () => {
    expect(itemPhoto({ ...url, user_id: 42 }, 42)).toMatchObject({ credit: null });
  });
  it("credits someone else's photo by copyright_holder", () => {
    expect(itemPhoto({ ...url, user_id: 7, copyright_holder: "ann" }, 42)?.credit).toBe("ann");
  });
  it("leaves out someone else's photo it cannot credit", () => {
    expect(itemPhoto({ ...url, user_id: 7 }, 42)).toBeNull();
  });
});
