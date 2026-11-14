import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/currency";
import { toDetail, type RawPatternFull } from "@/lib/ravelry/pattern-detail";

// Shapes follow live patterns/show responses (2026-11-13): 7574047 (paid knit),
// 7379294 (free crochet that still carries a price).
const author = { name: "Ann Designer", users: [{ id: 7, username: "anndesigns" }] };
const photo = (user_id: number, n: number) => ({
  user_id,
  medium_url: `https://images4-a.ravelrycache.com/m${n}.jpg`,
  small2_url: `https://images4-a.ravelrycache.com/s${n}.jpg`,
  aspect_ratio: 0.75,
});

const paid: RawPatternFull = {
  id: 1,
  name: "Nutcracker Cowl",
  permalink: "nutcracker-cowl",
  free: false,
  price: 8.5,
  currency: "USD",
  currency_symbol: "$",
  gauge_description: "24 stitches and 32 rows = 4 inches in stockinette",
  yardage_description: "626 yards",
  sizes_available: "ONE SIZE",
  difficulty_average: 4.2,
  difficulty_count: 5,
  yarn_weight_description: "Fingering (14 wpi)",
  pattern_needle_sizes: [{ name: "US 4  - 3.5 mm", knitting: true, crochet: false }],
  packs: [
    { yarn_id: 10, yarn: { id: 10, name: "Yummy 2-Ply", permalink: "yummy", yarn_company_name: "Miss Babs" } },
    { yarn_id: 10, yarn: { id: 10, name: "Yummy 2-Ply", permalink: "yummy", yarn_company_name: "Miss Babs" } },
    { yarn_id: null, yarn_name: "Any fingering yarn", yarn: null },
  ],
  craft: { name: "Knitting", permalink: "knitting" },
  pattern_author: author,
  photos: [photo(7, 1), photo(99, 2), photo(7, 3)],
};

describe("pattern detail", () => {
  it("maps all ISC-28 items from the response", () => {
    const d = toDetail(paid);
    expect(d).toMatchObject({
      designer: "Ann Designer",
      yarnWeight: "Fingering (14 wpi)",
      gauge: "24 stitches and 32 rows = 4 inches in stockinette",
      yardage: "626 yards",
      sizes: "ONE SIZE",
      needles: { label: "Needles", sizes: ["US 4 - 3.5 mm"] },
      difficulty: { average: 4.2, count: 5 },
      price: { amount: 8.5, currency: "USD", formatted: "$8.50 USD" },
      ravelryUrl: "https://www.ravelry.com/patterns/library/nutcracker-cowl",
    });
  });

  it("lists each suggested yarn once", () => {
    expect(toDetail(paid).suggestedYarns.map((y) => y.name)).toEqual(["Yummy 2-Ply", "Any fingering yarn"]);
  });

  it("keeps only creditable photos", () => {
    expect(toDetail(paid).photos.map((p) => p.src)).toEqual([
      "https://images4-a.ravelrycache.com/m1.jpg",
      "https://images4-a.ravelrycache.com/m3.jpg",
    ]);
  });

  it("hands paid patterns off to ravelry.com with no affiliate or tracking params", () => {
    const url = new URL(toDetail(paid).buyUrl!);
    expect(url.host).toBe("www.ravelry.com");
    expect([...url.searchParams.keys()]).toEqual(["buy"]);
  });

  it("treats free as free even when a price is present, with no Buy link", () => {
    const d = toDetail({ ...paid, free: true, price: 6.5 });
    expect(d.price).toBeNull();
    expect(d.buyUrl).toBeNull();
  });

  it("labels crochet sizes as a hook", () => {
    const d = toDetail({ ...paid, pattern_needle_sizes: [{ name: "5.0 mm (H)", knitting: false, crochet: true }] });
    expect(d.needles).toEqual({ label: "Hook", sizes: ["5.0 mm (H)"] });
  });
});

describe("price display", () => {
  it("keeps the pattern's own currency and amount", () => {
    expect(formatPrice(8.5, "USD")).toBe("$8.50 USD");
    expect(formatPrice(5.5, "EUR")).toBe("€5.50 EUR");
    expect(formatPrice(50, "DKK")).toBe("DKK\u00a050.00"); // Intl uses a no-break space
    expect(formatPrice(9, "CAD")).toBe("CA$9.00 CAD");
    expect(formatPrice(800, "JPY")).toBe("¥800 JPY");
  });
  it("falls back to the raw value for a code Intl rejects", () => {
    expect(formatPrice(3, "??")).toBe("3 ??");
  });
});
