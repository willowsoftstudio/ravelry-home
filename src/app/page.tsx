import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

// Home (Niddy brand, 2026-11-13): copy from Niddy_Website_Copy.md, photos from
// Category_Images (pre-sized WebP in public/brand/categories). Only claims that are
// true of the site are used: Niddy helps people find patterns; buying happens on
// Ravelry (ISC-79/80), so the guide's "marketplace"/"shop" lines are left out.
// Every link and form goes to a working, filtered /patterns search.

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const button = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-[background-color,opacity,border-color] duration-200 sm:min-h-10 ${ring}`;

const img = (slug: string) => ({
  src: `/brand/categories/${slug}-768.webp`,
  srcSet: `/brand/categories/${slug}-384.webp 384w, /brand/categories/${slug}-768.webp 768w`,
});

// Ravelry filters checked against pattern_categories/list (2026-11-13); parent
// categories include their children (sweater covers cardigan and pullover).
const CATEGORIES = [
  { label: "Knitting Patterns", href: "/patterns?craft=knitting", slug: "knitting", alt: "A purple cable-knit panel with bamboo needles beside balls of yarn and an open pattern book" },
  { label: "Crochet Patterns", href: "/patterns?craft=crochet", slug: "crochet", alt: "A granny square in progress with a purple crochet hook, a basket of yarn and a stitch chart" },
  { label: "Sweaters & Cardigans", href: "/patterns?pc=sweater", slug: "sweaters", alt: "A stack of folded cable-knit sweaters and a teal cardigan in warm daylight" },
  { label: "Blankets & Afghans", href: "/patterns?pc=blanket", slug: "blankets", alt: "A colorful granny-square blanket draped over an armchair beside a basket of yarn" },
  // "a|b" is Ravelry's OR for pc (live probe 2026-11-13)
  { label: "Hats & Scarves", href: "/patterns?pc=hat%7Cscarf", slug: "hats-scarves", alt: "Cable-knit hats with pompoms beside a cream scarf and a fringed granny-square scarf" },
  { label: "Amigurumi & Plushies", href: "/patterns?pc=softies", slug: "amigurumi", alt: "A group of crocheted toys: a fox, a bunny, a dinosaur, an owl, an octopus, a hedgehog and a bee" },
  { label: "Home Decor", href: "/patterns?pc=home", slug: "home-decor", alt: "A cozy corner with a crochet wall hanging, plant hangers, cushions, a striped basket and candle sleeves" },
] as const;

const MORE = [
  { label: "Free patterns", href: "/patterns?availability=free" },
  { label: "Knitting, free", href: "/patterns?craft=knitting&availability=free" },
  { label: "Crochet, free", href: "/patterns?craft=crochet&availability=free" },
];

export default function Home() {
  return (
    <>
      {/* Hero: copy left, layered category photos right */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-14 md:pt-16 md:pb-20">
        <div className="flex flex-col gap-5">
          <h1 className="text-5xl leading-[1.02] text-primary sm:text-6xl">
            Find it. Love it. <span className="text-secondary italic">Make it.</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Discover knitting and crochet patterns for your next handmade adventure. Explore fresh ideas, find a project you love, and start creating with Niddy.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/patterns" className={`${button} bg-cta text-cta-foreground shadow-(--shadow-raised) hover:opacity-90`}>
              Explore Patterns <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/design-system" className={`${button} px-2 text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground`}>
              View the design system
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md md:max-w-none" aria-hidden="true">
          {/* Decorative collage; the same photos are labelled in the category row below */}
          <div className="relative ml-auto aspect-square w-[82%] overflow-hidden rounded-2xl shadow-(--shadow-float) ring-1 ring-glass-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP in /public, no optimizer needed */}
            <img {...img("knitting")} sizes="(min-width: 768px) 40vw, 80vw" alt="" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
          </div>
          <div className="absolute bottom-[-8%] left-0 aspect-square w-[44%] overflow-hidden rounded-xl border-4 border-background shadow-(--shadow-float)">
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img {...img("crochet")} sizes="(min-width: 768px) 20vw, 40vw" alt="" decoding="async" className="h-full w-full object-cover" />
          </div>
          <span className="glass-strong absolute top-4 left-[8%] rounded-full px-3 py-1 font-heading text-sm text-primary italic">handmade starts here</span>
        </div>
      </section>

      {/* Search */}
      <section aria-labelledby="search-h" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <form action="/patterns" role="search" className="glass-strong grid gap-4 rounded-2xl p-5 sm:p-6 md:grid-cols-[1fr_1.4fr] md:items-center md:gap-8">
          <div className="flex flex-col gap-1">
            <h2 id="search-h" className="text-2xl text-foreground">
              Find a pattern you&rsquo;ll love.
            </h2>
            <p className="text-sm text-muted-foreground">Search for projects by craft and category to discover your next make.</p>
          </div>
          <div className="relative flex gap-2">
            <label htmlFor="home-query" className="sr-only">
              Search patterns
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="home-query"
              name="query"
              type="search"
              maxLength={100}
              placeholder="Search knitting and crochet patterns..."
              className={`min-h-11 w-full min-w-0 flex-1 rounded-lg border border-input bg-card pr-3 pl-9 text-base text-foreground shadow-(--shadow-raised) transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-ring ${ring}`}
            />
            <button type="submit" className={`${button} min-h-11 bg-cta text-cta-foreground shadow-(--shadow-raised) hover:opacity-90 sm:min-h-11`}>
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Categories */}
      <section aria-labelledby="cats-h" className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 id="cats-h" className="text-3xl text-primary">
            Browse by category
          </h2>
          <Link href="/patterns" className={`${button} px-2 text-muted-foreground hover:text-foreground max-sm:hidden`}>
            All patterns <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        {/* 7 tiles: rows of 4 (2 on phones, 3 on tablets); the short last row is centered */}
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-6">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="w-[calc((100%-1rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
              <Link href={c.href} className={`group flex flex-col gap-3 rounded-xl ${ring}`}>
                <div className="aspect-square overflow-hidden rounded-xl bg-muted shadow-(--shadow-raised) ring-1 ring-glass-border transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-(--shadow-float)">
                  {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
                  <img {...img(c.slug)} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" alt={c.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
                </div>
                <span className="flex items-center justify-between gap-2 px-0.5 font-heading text-lg text-foreground">
                  {c.label}
                  <ArrowRight aria-hidden="true" className="size-4 text-secondary transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap justify-center gap-2" aria-label="More ways to browse">
          {MORE.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className={`inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-(--shadow-raised) transition-[border-color,background-color] duration-200 hover:border-input hover:bg-muted sm:min-h-9 ${ring}`}
              >
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Promotional band */}
      <section className="border-y border-border bg-section-alt">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col items-start gap-3">
            <h2 className="text-3xl text-primary">Discover Your Next Project</h2>
            <p className="max-w-md text-muted-foreground">A little inspiration can turn into something extraordinary. Browse patterns and find your next favorite make.</p>
            <Link href="/patterns" className={`${button} mt-1 bg-cta text-cta-foreground shadow-(--shadow-raised) hover:opacity-90`}>
              Browse Patterns
            </Link>
          </div>
          <div className="flex flex-col items-start gap-3 md:border-l md:border-border md:pl-16">
            <h2 className="text-3xl text-primary">Made for Makers</h2>
            <p className="max-w-md text-muted-foreground">Whether you&rsquo;re learning your first stitch or planning your next masterpiece, there&rsquo;s always something new to create.</p>
            <Link href="/patterns?availability=free" className={`${button} mt-1 border border-border bg-card text-foreground shadow-(--shadow-raised) hover:bg-muted`}>
              Start Exploring
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
