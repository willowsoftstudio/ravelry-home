import { describe, expect, it } from "vitest";
import { darkTokens, isColor, lightTokens, mediaDarkTokens } from "./theme-tokens";

// ISA ISC-10: every light color token has a dark value.
describe("theme tokens", () => {
  const light = lightTokens();
  const dark = darkTokens();
  const lightColors = Object.keys(light).filter((k) => isColor(light[k]));

  it("defines a non-trivial light palette", () => {
    expect(lightColors.length).toBeGreaterThanOrEqual(15);
  });

  it("gives every light color token a dark value", () => {
    const missing = lightColors.filter((k) => !(k in dark) || !isColor(dark[k]));
    expect(missing).toEqual([]);
  });

  it("uses the same dark values for the OS-preference block and the .dark class", () => {
    expect(mediaDarkTokens()).toEqual(dark);
  });
});
