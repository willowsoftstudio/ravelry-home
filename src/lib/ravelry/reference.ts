import "server-only";
import { cacheLife } from "next/cache";
import { ravelryGet } from "./client";

// Reference lists Ravelry says to cache "for up to 24 hours" (ISC-64 allows <= 24 h).
// 'use cache' is per instance on serverless (Next 16 docs), so this is best effort.

export type Category = { permalink: string; name: string };

type RawCategory = { name: string; permalink: string; children?: RawCategory[] };

export async function getPatternCategories(): Promise<{ top: Category[]; all: Category[] }> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 82_800, expire: 86_400 });
  const data = await ravelryGet<{ pattern_categories: RawCategory | RawCategory[] }>(
    "/pattern_categories/list.json",
    {},
    { kind: "readonly" },
  );
  const root = data.pattern_categories;
  const topRaw = Array.isArray(root) ? root : (root.children ?? []);
  const all: Category[] = [];
  const walk = (c: RawCategory) => {
    all.push({ permalink: c.permalink, name: c.name });
    c.children?.forEach(walk);
  };
  topRaw.forEach(walk);
  return { top: topRaw.map((c) => ({ permalink: c.permalink, name: c.name })), all };
}
