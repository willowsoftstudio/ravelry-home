// Currency helpers shared by the server and the browser (no secrets, no I/O).
// Prices stay exactly as Ravelry returns them (ISC-81); estimates in another
// currency use the ECB's daily euro reference rates (ISC-85, Decision 2026-11-13).

/** ECB reference rates: units of each currency per 1 EUR, plus EUR itself = 1. */
export type Rates = { date: string; rates: Record<string, number> };

/** Display a price in its own currency without changing the amount. */
export function formatPrice(amount: number, currency: string): string {
  try {
    const formatted = new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
    return formatted.includes(currency) ? formatted : `${formatted} ${currency}`;
  } catch {
    return `${amount} ${currency}`; // unknown currency code: show it as Ravelry sent it
  }
}

/** Parse eurofxref-daily.xml. Throws when the feed has no date or no rates. */
export function parseEcbRates(xml: string): Rates {
  const date = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1];
  const rates: Record<string, number> = { EUR: 1 };
  for (const m of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)) {
    const r = Number(m[2]);
    if (r > 0 && Number.isFinite(r)) rates[m[1]] = r;
  }
  if (!date || Object.keys(rates).length < 2) throw new Error("ECB rates feed not recognised");
  return { date, rates };
}

/** amount in `from` expressed in `to`, or null when either currency has no ECB rate. */
export function convert(amount: number, from: string, to: string, { rates }: Rates): number | null {
  const a = rates[from];
  const b = rates[to];
  return a && b ? (amount / a) * b : null;
}

const EURO_REGIONS = new Set(
  "AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES AD MC SM VA ME XK".split(" "),
);
const REGION_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD", JP: "JPY", CH: "CHF", LI: "CHF",
  DK: "DKK", NO: "NOK", SE: "SEK", IS: "ISK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON",
  TR: "TRY", BR: "BRL", MX: "MXN", CN: "CNY", HK: "HKD", IN: "INR", ID: "IDR", IL: "ILS",
  KR: "KRW", MY: "MYR", PH: "PHP", SG: "SGD", TH: "THB", ZA: "ZAR",
};

/** Best guess at a visitor's currency from their language tags, e.g. "en-GB" -> GBP. */
export function guessCurrency(languages: readonly string[], rates: Rates): string | null {
  for (const tag of languages) {
    try {
      const region = new Intl.Locale(tag).maximize().region;
      const code = region && (EURO_REGIONS.has(region) ? "EUR" : REGION_CURRENCY[region]);
      if (code && rates.rates[code]) return code;
    } catch {
      // ignore malformed tags
    }
  }
  return null;
}

/** Currency name for the picker, e.g. "EUR — Euro". */
export function currencyLabel(code: string): string {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code);
    return name && name !== code ? `${code} — ${name}` : code;
  } catch {
    return code;
  }
}
