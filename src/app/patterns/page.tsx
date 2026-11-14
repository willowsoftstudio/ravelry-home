import type { Metadata } from "next";
import { Suspense } from "react";
import { PatternSearch } from "@/components/patterns/pattern-search";
import { parsePatternSearch, toSearchString } from "@/lib/ravelry/pattern-search-params";
import { searchPatterns, type PatternResults } from "@/lib/ravelry/patterns";
import { getPatternCategories, type Category } from "@/lib/ravelry/reference";
import { errorResponse } from "@/lib/ravelry/route-errors";

export const metadata: Metadata = { title: "Patterns" };

// Public pattern search (ISA F3, architecture: Discovery). The first page renders on
// the server from searchParams, so a shared link shows its results on first load
// (ISC-23, ISC-27); later filter changes run in the client through /api/patterns.
export default function PatternsPage({ searchParams }: PageProps<"/patterns">) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-8 pb-16 sm:px-6">
      <h1 className="text-3xl text-primary sm:text-4xl">Patterns</h1>
      {/* searchParams is request-time data: it streams in behind this boundary (Cache Components) */}
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/patterns">, "searchParams">) {
  const search = parsePatternSearch(await searchParams);
  let initial: PatternResults | null = null;
  let initialError: string | null = null;
  let categories: Category[] = [];
  try {
    [initial, { top: categories }] = await Promise.all([searchPatterns(search), getPatternCategories()]);
  } catch (err) {
    const body = (await errorResponse(err).json()) as { message?: string };
    initialError = body.message ?? "Ravelry could not answer this search.";
  }
  // Keyed by the canonical search: Next keeps a visited page mounted, so a client
  // navigation to /patterns with new filters (home page tiles, header link) would
  // otherwise reuse the old component state and show the previous results.
  return (
    <PatternSearch
      key={toSearchString(search)}
      initialSearch={search}
      initialResults={initial}
      initialError={initialError}
      categories={categories}
    />
  );
}

function ResultsSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="aspect-[4/5] rounded-lg bg-muted" />
      ))}
    </div>
  );
}
