import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { PatternNotes } from "@/components/patterns/pattern-notes";
import { PhotoGallery } from "@/components/patterns/photo-gallery";
import { PriceEstimate } from "@/components/patterns/price-estimate";
import { readSession } from "@/lib/auth/session";
import { RavelryError } from "@/lib/ravelry/client";
import { getPattern, type PatternDetail } from "@/lib/ravelry/pattern-detail";
import { errorResponse } from "@/lib/ravelry/route-errors";
import { SESSION_COOKIE } from "@/lib/session/cookies";
import { getRatesOrNull } from "@/lib/fx";
import type { Rates } from "@/lib/currency";

// Public pattern detail (ISA ISC-28; Buy on Ravelry hand-off ISC-79/80/81).
// params is request-time data under Cache Components, so the pattern streams in
// behind <Suspense>; the data itself is cached for <= 300 s in getPattern.

const link =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold outline-none transition-[background-color,opacity,border-color] duration-200 sm:min-h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const container = "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-4 sm:px-6";

function parseId(raw: string): number | null {
  return /^\d{1,10}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ params }: PageProps<"/patterns/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: "Pattern not found" };
  try {
    const p = await getPattern(id);
    return { title: `${p.name} by ${p.designer}` };
  } catch {
    return { title: "Pattern" };
  }
}

export default function PatternPage({ params }: PageProps<"/patterns/[id]">) {
  return (
    // Reskin 2026-11-13: asymmetric gallery + floating glass purchase panel, open fact
    // list, and the description in a full-bleed band below.
    <div className="flex flex-col">
      <div className={container}>
        <Link href="/patterns" className={`${link} -ml-3 self-start px-3 font-medium text-muted-foreground hover:bg-muted hover:text-foreground`}>
          ← All patterns
        </Link>
      </div>
      <Suspense fallback={<div className={container}><DetailSkeleton /></div>}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: Pick<PageProps<"/patterns/[id]">, "params">) {
  const id = parseId((await params).id);
  if (!id) notFound();
  let p: PatternDetail;
  let rates: Rates | null;
  try {
    [p, rates] = await Promise.all([getPattern(id), getRatesOrNull()]);
  } catch (err) {
    if (err instanceof RavelryError && err.status === 404) notFound();
    const body = (await errorResponse(err).json()) as { message?: string };
    return (
      <div className={container}>
        <p role="alert" className="rounded-lg border border-border bg-card p-4 text-sm shadow-(--shadow-raised)">
          {body.message ?? "Ravelry could not load this pattern."} Try again in a moment.
        </p>
      </div>
    );
  }

  const facts: { label: string; value: ReactNode; key: string }[] = [
    { key: "designer", label: "Designer", value: p.designer },
    { key: "weight", label: "Yarn weight", value: p.yarnWeight },
    { key: "gauge", label: "Gauge", value: p.gauge },
    { key: "yardage", label: "Yardage", value: p.yardage },
    { key: "sizes", label: "Sizes", value: p.sizes },
    { key: "needles", label: p.needles?.label ?? "Needles / hook", value: p.needles?.sizes.join(", ") },
    {
      key: "yarns",
      label: "Suggested yarns",
      value: p.suggestedYarns.length ? (
        <ul className="flex flex-col gap-1">
          {p.suggestedYarns.map((y) => (
            <li key={y.name}>
              {y.name}
              {y.company && !y.name.startsWith(y.company) ? <span className="text-muted-foreground"> · {y.company}</span> : null}
            </li>
          ))}
        </ul>
      ) : null,
    },
    {
      key: "difficulty",
      label: "Difficulty",
      value: p.difficulty
        ? `${p.difficulty.average.toFixed(1)} out of 10 (${p.difficulty.count.toLocaleString()} rating${p.difficulty.count === 1 ? "" : "s"})`
        : null,
    },
  ];

  return (
    <>
      <article className={`${container} pb-14 md:grid md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:items-start md:gap-10 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-14`}>
        <PhotoGallery photos={p.photos} name={p.name} />

        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-2">
            {p.craft ? <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{p.craft}</p> : null}
            <h1 className="text-3xl leading-tight text-primary sm:text-4xl">{p.name}</h1>
            <p className="text-sm text-muted-foreground">
              by <span className="font-medium text-foreground">{p.designer}</span>
            </p>
          </header>

          <section aria-label="Price" className={p.price || p.free ? "glass-strong flex flex-col gap-3 rounded-xl p-4 sm:p-5" : "flex flex-col gap-3"}>
            {p.free ? (
              <p className="text-2xl font-semibold tracking-[-0.02em] text-teal" data-price="free">
                Free
              </p>
            ) : p.price ? (
              rates ? (
                <PriceEstimate amount={p.price.amount} currency={p.price.currency} rates={rates}>
                  <ExactPrice amount={p.price.amount} currency={p.price.currency} formatted={p.price.formatted} />
                </PriceEstimate>
              ) : (
                <ExactPrice amount={p.price.amount} currency={p.price.currency} formatted={p.price.formatted} />
              )
            ) : (
              <p className="text-sm text-muted-foreground">Not sold on Ravelry</p>
            )}
            <div className="flex flex-wrap gap-2">
              {p.buyUrl ? (
                <Suspense fallback={<BuyLink href={p.buyUrl} />}>
                  <SessionBuyLink href={p.buyUrl} />
                </Suspense>
              ) : null}
              <a href={p.ravelryUrl} className={`${link} border border-border bg-card text-foreground shadow-(--shadow-raised) hover:border-input hover:bg-muted`} data-ravelry-link>
                View on Ravelry
              </a>
            </div>
            {p.buyUrl ? (
              <p className="text-xs text-muted-foreground">
                Checkout happens on Ravelry, in the designer&rsquo;s currency ({p.price?.currency}). Your card may convert it.
              </p>
            ) : null}
          </section>

          <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] text-sm">
            {facts.map((f) => (
              <div key={f.key} className="col-span-2 grid grid-cols-subgrid gap-x-6 border-t border-border py-2.5 last:border-b" data-fact={f.key}>
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className={f.value ? "min-w-0 break-words font-medium" : "text-muted-foreground"}>{f.value || "Not listed"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </article>

      {p.notes.length ? (
        <div className="border-t border-border bg-section-alt">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <PatternNotes blocks={p.notes} />
          </div>
        </div>
      ) : null}
    </>
  );
}

// The exact price as patterns/show returns it (ISC-81), rendered on the server.
function ExactPrice({ amount, currency, formatted }: { amount: number; currency: string; formatted: string }) {
  return (
    <p className="text-2xl font-semibold tracking-[-0.02em] tabular-nums" data-price={amount} data-currency={currency}>
      {formatted}
    </p>
  );
}

function BuyLink({ href }: { href: string }) {
  return (
    <a href={href} className={`${link} bg-cta text-cta-foreground shadow-(--shadow-raised) hover:opacity-90`} data-buy-link>
      Buy on Ravelry
    </a>
  );
}

// Signed-in users get guest_buy=0 so Ravelry asks them to log in instead of a guest
// checkout (architecture: Purchasing). Request-time only, like SessionNav.
async function SessionBuyLink({ href }: { href: string }) {
  await connection();
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  return <BuyLink href={session ? `${href}&guest_buy=0` : href} />;
}

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-8 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-10 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-14">
      <div className="aspect-square rounded-xl bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="h-9 w-3/4 rounded bg-muted" />
        <div className="h-6 w-1/3 rounded bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
