"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { convert, currencyLabel, formatPrice, guessCurrency, type Rates } from "@/lib/currency";

// Approximate price in a currency the visitor picks (ISC-85). The exact price and
// the Buy on Ravelry link are rendered by the server and never change (ISC-81).
// The choice is a per-browser convenience in localStorage, guessed from the
// browser's language the first time.

const STORAGE_KEY = "niddy.displayCurrency";

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function store(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // private mode or blocked storage: the choice lasts for this page only
  }
}

/** Wraps the server-rendered exact price (children) and adds the estimate beside it. */
export function PriceEstimate({ amount, currency, rates, children }: { amount: number; currency: string; rates: Rates; children: ReactNode }) {
  const id = useId();
  // null until mounted, so the server and first client render agree.
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStored();
    const initial = stored && rates.rates[stored] ? stored : guessCurrency(navigator.languages ?? [navigator.language], rates);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only state after hydration
    if (initial) setPicked(initial);
  }, [rates]);

  if (!rates.rates[currency]) return <>{children}</>; // the ECB has no rate for this pattern's currency

  const codes = Object.keys(rates.rates).sort();
  const target = picked ?? currency;
  const estimate = target !== currency ? convert(amount, currency, target, rates) : null;
  const rateDate = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${rates.date}T00:00:00Z`));

  return (
    <div className="flex flex-col gap-3">
      {/* Same line as the price, so the estimate appearing after hydration shifts nothing */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {children}
        <span aria-live="polite" className="text-sm text-muted-foreground tabular-nums" data-price-estimate={estimate !== null ? target : undefined}>
          {estimate !== null ? (
            <>
              ≈ <span className="font-semibold text-foreground">{formatPrice(Math.round(estimate * 100) / 100, target)}</span> estimate
            </>
          ) : null}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-cur`} className="text-xs font-medium text-muted-foreground">
          Show estimate in
        </label>
        <select
          id={`${id}-cur`}
          value={target}
          onChange={(e) => {
            setPicked(e.target.value);
            store(e.target.value);
          }}
          className="min-h-11 rounded-lg border border-input bg-card px-2.5 text-base text-foreground shadow-(--shadow-raised) outline-none transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-9 sm:text-sm"
        >
          {codes.map((c) => (
            <option key={c} value={c}>
              {c === currency ? `${currencyLabel(c)} (pattern price)` : currencyLabel(c)}
            </option>
          ))}
        </select>
      </div>
      {estimate !== null ? (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Approximate, using the European Central Bank rate of {rateDate}. Ravelry charges {formatPrice(amount, currency)}; your bank sets the final amount.
        </p>
      ) : null}
    </div>
  );
}

