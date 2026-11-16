"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AVAILABILITY,
  CRAFTS,
  FITS,
  FIT_LABELS,
  WEIGHTS,
  WEIGHT_LABELS,
  toSearchString,
  type PatternSearch as Search,
} from "@/lib/ravelry/pattern-search-params";
import type { PatternResults } from "@/lib/ravelry/patterns";
import type { Category } from "@/lib/ravelry/reference";
import { PatternCard } from "./pattern-card";

type Props = {
  initialSearch: Search;
  initialResults: PatternResults | null;
  initialError: string | null;
  categories: Category[];
};

type FilterKey = "craft" | "fit" | "availability" | "weight" | "pc";

const CRAFT_LABELS: Record<(typeof CRAFTS)[number], string> = { knitting: "Knitting", crochet: "Crochet" };
const AVAILABILITY_LABELS: Record<(typeof AVAILABILITY)[number], string> = { free: "Free", ravelry: "Ravelry download" };

// Ravelry reports at most 100,000 results (live probe 2026-11-13), so that means "or more".
const RAVELRY_RESULT_CAP = 100_000;

async function fetchResults(qs: string): Promise<PatternResults> {
  const res = await fetch(`/api/patterns${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Ravelry could not answer this search.");
  }
  return res.json();
}

// Search state lives in the URL (ISC-27). Changing a filter replaces the URL and asks
// TanStack Query for that query string: a state already seen this session renders from
// memory with no /api request (ISC-31); a new one fetches /api/patterns (ISC-30).
export function PatternSearch({ initialSearch, initialResults, initialError, categories }: Props) {
  const [search, setSearch] = useState<Search>(initialSearch);
  const [initialKey] = useState(() => toSearchString(initialSearch));
  const qs = toSearchString(search);

  const { data, error, isFetching } = useQuery({
    queryKey: ["patterns", qs],
    queryFn: () => fetchResults(qs),
    initialData: qs === initialKey && initialResults ? initialResults : undefined,
    placeholderData: keepPreviousData,
  });

  const errorMessage = error?.message ?? (qs === initialKey && !initialResults ? initialError : null);

  function update(next: Search) {
    setSearch(next);
    const nextQs = toSearchString(next);
    window.history.replaceState(null, "", nextQs ? `/patterns?${nextQs}` : "/patterns");
  }

  function toggle(key: FilterKey, value: string) {
    update({ ...search, [key]: search[key] === value ? undefined : value, page: undefined });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = String(new FormData(e.currentTarget).get("query") ?? "").trim().slice(0, 100);
    update({ ...search, query: query || undefined, page: undefined });
  }

  const activeCount = (["craft", "fit", "availability", "weight", "pc"] as const).filter((k) => search[k]).length;
  const page = data?.page ?? 1;
  const pageCount = data?.pageCount ?? 0;

  const groups: { key: FilterKey; label: string; options: { value: string; label: string }[] }[] = [
    { key: "craft", label: "Craft", options: CRAFTS.map((v) => ({ value: v, label: CRAFT_LABELS[v] })) },
    { key: "fit", label: "Age / size", options: FITS.map((v) => ({ value: v, label: FIT_LABELS[v] })) },
    { key: "availability", label: "Availability", options: AVAILABILITY.map((v) => ({ value: v, label: AVAILABILITY_LABELS[v] })) },
    { key: "weight", label: "Yarn weight", options: WEIGHTS.map((v) => ({ value: v, label: WEIGHT_LABELS[v] })) },
    ...(categories.length
      ? [{ key: "pc" as const, label: "Category", options: categories.map((c) => ({ value: c.permalink, label: c.name })) }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <form role="search" onSubmit={onSubmit} className="relative flex min-w-0 flex-1 basis-72 gap-2">
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="pattern-query" className="sr-only">
            Search patterns
          </label>
          <Input
            id="pattern-query"
            name="query"
            type="search"
            defaultValue={search.query ?? ""}
            maxLength={100}
            placeholder="Cowl, raglan, socks…"
            className="flex-1 pl-9"
          />
          <Button type="submit">Search</Button>
        </form>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            <SlidersHorizontal aria-hidden="true" />
            Filters{activeCount ? ` (${activeCount})` : ""}
          </DialogTrigger>
          <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
              <DialogDescription>Results update as you choose.</DialogDescription>
            </DialogHeader>
            {groups.map((g) => (
              <fieldset key={g.key} className="flex flex-col gap-2">
                <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.label}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {g.options.map((o) => {
                    const on = search[g.key] === o.value;
                    return (
                      <Button
                        key={o.value}
                        type="button"
                        size="sm"
                        variant={on ? "default" : "outline"}
                        aria-pressed={on}
                        data-filter={g.key}
                        data-value={o.value}
                        onClick={() => toggle(g.key, o.value)}
                      >
                        {o.label}
                      </Button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            {activeCount ? (
              <Button type="button" variant="ghost" onClick={() => update({ query: search.query })}>
                Clear filters
              </Button>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>

      <p aria-live="polite" className="-mt-1 text-sm text-muted-foreground tabular-nums empty:hidden">
        {errorMessage
          ? null
          : data
            ? `${data.total >= RAVELRY_RESULT_CAP ? `${RAVELRY_RESULT_CAP.toLocaleString()}+` : data.total.toLocaleString()} pattern${data.total === 1 ? "" : "s"}${isFetching ? " · updating…" : ""}`
            : "Loading…"}
      </p>

      {errorMessage ? (
        <p role="alert" className="rounded-lg border border-border bg-card p-4 text-sm shadow-(--shadow-raised)">
          {errorMessage}
        </p>
      ) : data && data.patterns.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm shadow-(--shadow-raised)">No patterns match. Try fewer filters.</p>
      ) : data ? (
        <ul
          data-testid="pattern-results"
          aria-busy={isFetching}
          className="grid grid-cols-2 gap-x-4 gap-y-6 transition-opacity duration-200 aria-busy:opacity-60 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {data.patterns.map((p, i) => (
            <PatternCard key={p.id} pattern={p} priority={i < 2} />
          ))}
        </ul>
      ) : null}

      {data && pageCount > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => update({ ...search, page: page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= Math.min(pageCount, 1000)}
            onClick={() => update({ ...search, page: page + 1 })}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
