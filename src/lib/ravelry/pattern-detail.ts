import "server-only";
import { cacheLife } from "next/cache";
import { formatPrice } from "@/lib/currency";
import { ravelryGet } from "./client";
import { parseNotes, type NoteBlock } from "./notes";
import { toCardPhoto, type CardPhoto, type RawAuthor, type RawPhoto } from "./patterns";

// Pattern detail from patterns/show (ISA ISC-28, architecture: Discovery). Field
// shapes checked against live responses on 2026-11-13 (paid knit 7574047, free crochet
// 7379294). Note: a free pattern can still carry a price, so `free` always wins.

type RawNeedle = { name: string; knitting?: boolean; crochet?: boolean };
type RawPack = {
  yarn_id?: number | null;
  yarn_name?: string | null;
  yarn?: { id: number; name: string; permalink: string; yarn_company_name?: string | null } | null;
};
export type RawPatternFull = {
  id: number;
  name: string;
  permalink: string;
  free: boolean;
  price?: number | null;
  currency?: string | null;
  currency_symbol?: string | null;
  url?: string | null;
  gauge_description?: string | null;
  yardage_description?: string | null;
  sizes_available?: string | null;
  difficulty_average?: number | null;
  difficulty_count?: number | null;
  yarn_weight_description?: string | null;
  yarn_weight?: { name: string } | null;
  pattern_needle_sizes?: RawNeedle[] | null;
  packs?: RawPack[] | null;
  craft?: { name: string; permalink: string } | null;
  notes?: string | null;
  pattern_author?: (RawAuthor & { permalink?: string }) | null;
  photos?: RawPhoto[] | null;
};

export type SuggestedYarn = { id: number | null; name: string; company: string | null };
export type PatternDetail = {
  id: number;
  name: string;
  permalink: string;
  designer: string;
  craft: string | null;
  free: boolean;
  /** Exactly as patterns/show returns it (ISC-81); null when free or not sold on Ravelry. */
  price: { amount: number; currency: string; formatted: string } | null;
  yarnWeight: string | null;
  gauge: string | null;
  yardage: string | null;
  sizes: string | null;
  needles: { label: "Needles" | "Hook" | "Needles / hook"; sizes: string[] } | null;
  suggestedYarns: SuggestedYarn[];
  difficulty: { average: number; count: number } | null;
  notes: NoteBlock[];
  photos: CardPhoto[];
  ravelryUrl: string;
  /** Hosted hand-off to Ravelry's buy box (ISC-79); never carries ref/aff/utm (ISC-80). */
  buyUrl: string | null;
};

const RAVELRY_PATTERN = "https://www.ravelry.com/patterns/library/";
const text = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export function toDetail(p: RawPatternFull): PatternDetail {
  const designer = p.pattern_author?.name ?? "Unknown designer";
  const ravelryUrl = `${RAVELRY_PATTERN}${encodeURIComponent(p.permalink)}`;
  const price =
    !p.free && typeof p.price === "number" && p.currency
      ? { amount: p.price, currency: p.currency, formatted: formatPrice(p.price, p.currency) }
      : null;

  const needleList = p.pattern_needle_sizes ?? [];
  const isHook = needleList.length > 0 && needleList.every((n) => n.crochet && !n.knitting);
  const isMixed = needleList.some((n) => n.crochet) && needleList.some((n) => n.knitting);

  const seen = new Set<string>();
  const suggestedYarns: SuggestedYarn[] = [];
  for (const pack of p.packs ?? []) {
    const name = text(pack.yarn?.name ?? pack.yarn_name);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    suggestedYarns.push({ id: pack.yarn?.id ?? pack.yarn_id ?? null, name, company: text(pack.yarn?.yarn_company_name) });
  }

  const photos = (p.photos ?? [])
    .map((ph, i) => toCardPhoto(ph, p.pattern_author, `${p.name}, photo ${i + 1}${ph.caption ? `: ${ph.caption}` : ""}`))
    .filter((ph): ph is CardPhoto => ph !== null);

  return {
    id: p.id,
    name: p.name,
    permalink: p.permalink,
    designer,
    craft: p.craft?.name ?? null,
    free: p.free,
    price,
    yarnWeight: text(p.yarn_weight_description) ?? text(p.yarn_weight?.name),
    gauge: text(p.gauge_description),
    yardage: text(p.yardage_description),
    sizes: text(p.sizes_available),
    needles: needleList.length
      ? { label: isMixed ? "Needles / hook" : isHook ? "Hook" : "Needles", sizes: needleList.map((n) => n.name.replace(/\s+/g, " ").trim()) }
      : null,
    suggestedYarns,
    difficulty:
      typeof p.difficulty_average === "number" && p.difficulty_average > 0 && p.difficulty_count
        ? { average: p.difficulty_average, count: p.difficulty_count }
        : null,
    notes: parseNotes(p.notes),
    photos,
    ravelryUrl,
    buyUrl: price ? `${ravelryUrl}?buy=1` : null,
  };
}

/** One pattern by numeric id; cached briefly like search (ISC-64: <= 300 s). */
export async function getPattern(id: number): Promise<PatternDetail> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 240, expire: 300 });
  const data = await ravelryGet<{ pattern: RawPatternFull }>(`/patterns/${id}.json`, {}, { kind: "readonly" });
  return toDetail(data.pattern);
}
