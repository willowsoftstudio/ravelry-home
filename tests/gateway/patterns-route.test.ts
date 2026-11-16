import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/patterns/route";

// /api/patterns forwards only whitelisted filters, checks pc against Ravelry's
// category list (an unknown one makes Ravelry answer 500), and caches publicly
// for at most 300 s (ISC-78).

const API = "https://api.ravelry.test";
const CATEGORIES = { pattern_categories: { children: [{ name: "Accessories", permalink: "accessories", children: [{ name: "Neck", permalink: "neck-torso" }] }] } };
const SEARCH = { patterns: [], paginator: { page: 1, page_count: 0, results: 0 } };

describe("/api/patterns", () => {
  let calls: URL[];
  beforeEach(() => {
    calls = [];
    vi.stubEnv("RAVELRY_API_BASE", API);
    vi.stubEnv("RAVELRY_READONLY_USERNAME", "u");
    vi.stubEnv("RAVELRY_READONLY_PASSWORD", "p");
    vi.stubGlobal("fetch", vi.fn(async (input: URL | string) => {
      const url = new URL(String(input));
      calls.push(url);
      return Response.json(url.pathname === "/pattern_categories/list.json" ? CATEGORIES : SEARCH);
    }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const searchCall = () => calls.find((c) => c.pathname === "/patterns/search.json")!;

  it("forwards known filters and drops everything else", async () => {
    const res = await GET(new NextRequest("http://localhost/api/patterns?query=cowl&craft=knitting&fit=adult&needles=4mm&debug=1&weight=chunky"));
    expect(res.status).toBe(200);
    const q = Object.fromEntries(searchCall().searchParams);
    expect(q).toEqual({ query: "cowl", craft: "knitting", fit: "adult", page: "1", page_size: "24" });
  });

  it("forwards a category only when Ravelry lists it", async () => {
    await GET(new NextRequest("http://localhost/api/patterns?pc=neck-torso"));
    expect(searchCall().searchParams.get("pc")).toBe("neck-torso");
    calls = [];
    await GET(new NextRequest("http://localhost/api/patterns?pc=nosuchcategory-zz"));
    expect(searchCall().searchParams.has("pc")).toBe(false);
  });

  it("keeps only the listed categories of an OR filter", async () => {
    await GET(new NextRequest("http://localhost/api/patterns?pc=neck-torso|nosuchcategory-zz"));
    expect(searchCall().searchParams.get("pc")).toBe("neck-torso");
    calls = [];
    await GET(new NextRequest("http://localhost/api/patterns?pc=accessories|neck-torso"));
    expect(searchCall().searchParams.get("pc")).toBe("accessories|neck-torso");
  });

  it("is cached publicly for at most 300 s", async () => {
    const res = await GET(new NextRequest("http://localhost/api/patterns?query=cowl"));
    const maxAge = Number(/s-maxage=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1]);
    expect(res.headers.get("cache-control")).toContain("public");
    expect(maxAge).toBeGreaterThanOrEqual(1);
    expect(maxAge).toBeLessThanOrEqual(300);
  });
});
