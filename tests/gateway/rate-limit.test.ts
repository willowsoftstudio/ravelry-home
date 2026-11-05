import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/patterns/route";

// ISA ISC-21: an upstream 429 becomes a 503 with an integer Retry-After in [1, 120].

function upstream(status: number, headers: Record<string, string> = {}) {
  return vi.fn(async () => new Response(JSON.stringify({}), { status, headers }));
}

const request = () => new NextRequest("http://localhost/api/patterns?query=cowl");

describe("public pattern search on upstream 429", () => {
  beforeEach(() => {
    vi.stubEnv("RAVELRY_READONLY_USERNAME", "test-user");
    vi.stubEnv("RAVELRY_READONLY_PASSWORD", "test-pass");
    vi.stubEnv("RAVELRY_API_BASE", "https://api.ravelry.test");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const cases: Array<[string, Record<string, string>, number]> = [
    ["no Retry-After", {}, 30],
    ["Retry-After 5", { "Retry-After": "5" }, 5],
    ["Retry-After above the cap", { "Retry-After": "999" }, 120],
    ["Retry-After 0", { "Retry-After": "0" }, 1],
    ["Retry-After as a date", { "Retry-After": new Date(Date.now() + 42_000).toUTCString() }, 42],
  ];

  for (const [name, headers, expected] of cases) {
    it(`returns 503 with Retry-After ${expected} (${name})`, async () => {
      vi.stubGlobal("fetch", upstream(429, headers));
      const res = await GET(request());
      expect(res.status).toBe(503);
      const retryAfter = res.headers.get("Retry-After");
      expect(retryAfter).toMatch(/^\d+$/);
      const n = Number(retryAfter);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(120);
      expect(Math.abs(n - expected)).toBeLessThanOrEqual(1);
    });
  }

  it("calls Ravelry's pattern search with read-only basic auth", async () => {
    const fetchMock = upstream(200);
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(request());
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe("https://api.ravelry.test/patterns/search.json?query=cowl&page=1&page_size=24");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("test-user:test-pass").toString("base64")}`,
    );
  });
});
