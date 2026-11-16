import "server-only";
import { cacheLife } from "next/cache";
import { ravelryGet } from "./client";
import { PAGE_SIZE, type PatternSearch } from "./pattern-search-params";
import { getPatternCategories } from "./reference";

export type RawUser = { id: number; username: string };
export type RawPhoto = {
  user_id?: number;
  copyright_holder?: string | null;
  small2_url?: string;
  medium_url?: string;
  medium2_url?: string;
  aspect_ratio?: number;
  caption?: string | null;
};
export type RawAuthor = { name: string; users?: RawUser[] };
type RawPattern = {
  id: number;
  name: string;
  permalink: string;
  free: boolean;
  first_photo?: RawPhoto | null;
  pattern_author?: RawAuthor | null;
};
type RawSearch = { patterns: RawPattern[]; paginator: { page: number; page_count: number; results: number } };

export type CardPhoto = { src: string; srcSet: string; aspectRatio: number; alt: string; credit: string };
export type PatternCard = {
  id: number;
  name: string;
  permalink: string;
  designer: string;
  free: boolean;
  photo: CardPhoto | null;
};
export type PatternResults = { patterns: PatternCard[]; page: number; pageCount: number; total: number };

/**
 * Photo credit (Decision 2026-11-12): a photo is shown only when it can be credited:
 * by the designer's username (photo.user_id is one of pattern_author.users) or by
 * copyright_holder. Anything else returns null and is left out.
 */
export function creditFor(photo: RawPhoto | null | undefined, author: RawAuthor | null | undefined): string | null {
  if (!photo) return null;
  if (photo.copyright_holder?.trim()) return photo.copyright_holder.trim();
  const user = author?.users?.find((u) => u.id === photo.user_id);
  return user ? user.username : null;
}

/** A displayable photo, or null when it cannot be credited (Decision 2026-11-12). */
export function toCardPhoto(
  ph: RawPhoto | null | undefined,
  author: RawAuthor | null | undefined,
  alt: string,
): CardPhoto | null {
  const credit = creditFor(ph, author);
  const src = ph?.medium_url ?? ph?.small2_url;
  if (!ph || !credit || !src) return null;
  return {
    src,
    srcSet: [ph.small2_url && `${ph.small2_url} 320w`, ph.medium_url && `${ph.medium_url} 500w`, ph.medium2_url && `${ph.medium2_url} 640w`]
      .filter(Boolean)
      .join(", "),
    aspectRatio: ph.aspect_ratio && ph.aspect_ratio > 0 ? ph.aspect_ratio : 0.8,
    alt,
    credit,
  };
}

export function toCard(p: RawPattern): PatternCard {
  const designer = p.pattern_author?.name ?? "Unknown designer";
  return {
    id: p.id,
    name: p.name,
    permalink: p.permalink,
    designer,
    free: p.free,
    photo: toCardPhoto(p.first_photo, p.pattern_author, `${p.name}, a pattern by ${designer}`),
  };
}

/** Search Ravelry patterns with whitelisted filters; cached briefly (ISC-64: <= 300 s). */
export async function searchPatterns(s: PatternSearch): Promise<PatternResults> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 240, expire: 300 });
  let pc = s.pc;
  if (pc) {
    const { all } = await getPatternCategories();
    const known = new Set(all.map((c) => c.permalink));
    // Keep only permalinks Ravelry lists (an unknown one answers 500); "a|b" means either.
    pc = pc.split("|").filter((p) => known.has(p)).join("|") || undefined;
  }
  const data = await ravelryGet<RawSearch>(
    "/patterns/search.json",
    { query: s.query, craft: s.craft, availability: s.availability, weight: s.weight, fit: s.fit, pc, page: s.page ?? 1, page_size: PAGE_SIZE },
    { kind: "readonly" },
  );
  return {
    patterns: data.patterns.map(toCard),
    page: data.paginator.page,
    pageCount: data.paginator.page_count,
    total: data.paginator.results,
  };
}
