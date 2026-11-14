import { describe, expect, it } from "vitest";
import { parsePatternSearch, toSearchString } from "@/lib/ravelry/pattern-search-params";

// Malformed filter values make Ravelry answer 500, so only whitelisted names and values pass.
describe("pattern search params", () => {
  it("keeps known filters", () => {
    expect(parsePatternSearch(new URLSearchParams("query=cowl&craft=knitting&weight=fingering&availability=free&pc=accessories&page=2")))
      .toEqual({ query: "cowl", craft: "knitting", weight: "fingering", availability: "free", pc: "accessories", page: 2 });
  });

  it("drops unknown names and bad values instead of forwarding them", () => {
    const s = parsePatternSearch(new URLSearchParams("needles=4mm&craft=weaving&weight=chunky&availability=maybe&pc=Bad%20Value&page=-3&fiberc=wool&debug=1"));
    expect(s).toEqual({ query: undefined, craft: undefined, weight: undefined, availability: undefined, pc: undefined, page: undefined });
  });

  it("trims and caps the free-text query", () => {
    expect(parsePatternSearch({ query: "  shawl  " }).query).toBe("shawl");
    expect(parsePatternSearch({ query: "x".repeat(101) }).query).toBeUndefined();
    expect(parsePatternSearch({ query: "   " }).query).toBeUndefined();
  });

  it("builds one canonical URL per search, whatever the input order", () => {
    const a = toSearchString(parsePatternSearch(new URLSearchParams("weight=dk&query=hat&craft=crochet")));
    const b = toSearchString(parsePatternSearch(new URLSearchParams("craft=crochet&query=hat&weight=dk")));
    expect(a).toBe("query=hat&craft=crochet&weight=dk");
    expect(b).toBe(a);
    expect(toSearchString({ page: 1 })).toBe("");
  });
  it("accepts up to 3 categories joined by | and rejects more or malformed ones", () => {
    expect(parsePatternSearch(new URLSearchParams("pc=hat|scarf")).pc).toBe("hat|scarf");
    expect(parsePatternSearch(new URLSearchParams("pc=a|b|c|d")).pc).toBeUndefined();
    expect(parsePatternSearch(new URLSearchParams("pc=hat||scarf")).pc).toBeUndefined();
    expect(parsePatternSearch(new URLSearchParams("pc=hat|")).pc).toBeUndefined();
  });
});
