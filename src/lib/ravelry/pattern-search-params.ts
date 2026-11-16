import { z } from "zod";

// Whitelisted pattern-search filters (specs/ravelry-api-verification.md, Live probe).
// Malformed values make Ravelry answer 500, so only these names and values pass.
// Shared by the server gateway and the client UI (no secrets here).

export const CRAFTS = ["knitting", "crochet"] as const;
export const AVAILABILITY = ["free", "ravelry"] as const;
export const WEIGHTS = [
  "cobweb", "lace", "light-fingering", "fingering", "sport", "dk",
  "worsted", "aran", "bulky", "super-bulky", "jumbo", "thread",
] as const;
export const FITS = ["adult", "baby", "toddler", "child", "teen", "preemie"] as const;

export const WEIGHT_LABELS: Record<(typeof WEIGHTS)[number], string> = {
  cobweb: "Cobweb", lace: "Lace", "light-fingering": "Light fingering", fingering: "Fingering",
  sport: "Sport", dk: "DK", worsted: "Worsted", aran: "Aran", bulky: "Bulky",
  "super-bulky": "Super bulky", jumbo: "Jumbo", thread: "Thread",
};

export const FIT_LABELS: Record<(typeof FITS)[number], string> = {
  adult: "Adult",
  baby: "Baby",
  toddler: "Toddler",
  child: "Child",
  teen: "Teen",
  preemie: "Preemie",
};

export const PAGE_SIZE = 24;

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

export const patternSearchSchema = z.object({
  query: z.string().trim().max(100).optional().catch(undefined).transform((v) => v || undefined),
  craft: optionalEnum(CRAFTS),
  availability: optionalEnum(AVAILABILITY),
  weight: optionalEnum(WEIGHTS),
  fit: optionalEnum(FITS),
  // Category permalink, or up to 3 joined by "|" (Ravelry reads it as OR: live probe
  // 2026-11-13, hat 815 + scarf 276 -> hat|scarf 1085). Each one is checked against
  // Ravelry's category list on the server: an unknown permalink answers 500.
  pc: z.string().regex(/^[a-z0-9-]{1,60}(\|[a-z0-9-]{1,60}){0,2}$/).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

// Every filter is optional (zod infers transformed keys as required).
export type PatternSearch = Partial<z.infer<typeof patternSearchSchema>>;

/** Parse untrusted URL params; unknown names and bad values are dropped, never forwarded. */
export function parsePatternSearch(input: URLSearchParams | Record<string, string | string[] | undefined>): PatternSearch {
  const get = (k: string) => {
    const v = input instanceof URLSearchParams ? input.get(k) : input[k];
    return Array.isArray(v) ? v[0] : (v ?? undefined);
  };
  return patternSearchSchema.parse({
    query: get("query"), craft: get("craft"), availability: get("availability"),
    weight: get("weight"), fit: get("fit"), pc: get("pc"), page: get("page"),
  });
}

/** Canonical query string (fixed key order) so equal searches share one URL and cache key. */
export function toSearchString(s: PatternSearch): string {
  const p = new URLSearchParams();
  for (const k of ["query", "craft", "fit", "availability", "weight", "pc"] as const) if (s[k]) p.set(k, String(s[k]));
  if (s.page && s.page > 1) p.set("page", String(s.page));
  return p.toString();
}
