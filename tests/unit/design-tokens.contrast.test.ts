import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { darkTokens, lightTokens } from "./theme-tokens";

// ISA ISC-11: >= 8 pairs; text >= 4.5:1, ui >= 3:1, in light and dark.
// Ratios are recomputed from globals.css, not read from the JSON.

type Pair = { kind: "text" | "ui"; fg: string; bg: string };
const file = join(__dirname, "../../design-system/ravelry-companion-site/contrast-pairs.json");
const { pairs, bars } = JSON.parse(readFileSync(file, "utf8")) as {
  pairs: Pair[];
  bars: Record<Pair["kind"], number>;
};

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`expected a #rrggbb token value, got "${hex}"`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("contrast pairs", () => {
  it("lists at least 8 pairs, each tagged text or ui", () => {
    expect(pairs.length).toBeGreaterThanOrEqual(8);
    for (const p of pairs) expect(["text", "ui"]).toContain(p.kind);
  });

  for (const [theme, tokens] of [
    ["light", lightTokens()],
    ["dark", darkTokens()],
  ] as const) {
    it(`meets every bar in the ${theme} theme`, () => {
      const failures = pairs
        .map((p) => ({ ...p, ratio: contrast(tokens[p.fg], tokens[p.bg]) }))
        .filter((p) => p.ratio < bars[p.kind])
        .map((p) => `${p.fg} on ${p.bg}: ${p.ratio.toFixed(2)} < ${bars[p.kind]}`);
      expect(failures).toEqual([]);
    });
  }
});
