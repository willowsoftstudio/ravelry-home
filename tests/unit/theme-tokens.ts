import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

export const globalsCss = readFileSync(join(root, "src/app/globals.css"), "utf8");

/** Returns the custom properties declared in the first block whose selector matches. */
export function tokensFor(selector: RegExp, css = globalsCss): Record<string, string> {
  const match = selector.exec(css);
  if (!match) throw new Error(`selector ${selector} not found in globals.css`);
  const start = css.indexOf("{", match.index) + 1;
  let depth = 1;
  let end = start;
  while (depth > 0 && end < css.length) {
    if (css[end] === "{") depth++;
    if (css[end] === "}") depth--;
    end++;
  }
  const body = css.slice(start, end - 1);
  const tokens: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

export const isColor = (v: string) => /^(#|rgb|hsl|oklch|oklab)/i.test(v);

export const lightTokens = () => tokensFor(/^:root,\s*\n\.light\s*\{/m);
export const darkTokens = () => tokensFor(/^\.dark\s*\{/m);
export const mediaDarkTokens = () => tokensFor(/:root:not\(\.light\)\s*\{/);
