import "server-only";
import { cacheLife } from "next/cache";
import { parseEcbRates, type Rates } from "./currency";

// ECB daily euro reference rates for the approximate price estimate (ISC-85).
// The only non-Ravelry host the server calls (ISC-4, Decision 2026-11-13). The ECB
// publishes once per working day, so a cache of up to 12 h is plenty.

const ECB_DAILY = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

export async function getRates(): Promise<Rates> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 21_600, expire: 43_200 });
  const res = await fetch(ECB_DAILY, { signal: AbortSignal.timeout(5000), headers: { Accept: "text/xml" } });
  if (!res.ok) throw new Error(`ECB rates responded ${res.status}`);
  return parseEcbRates(await res.text());
}

/** Rates, or null when the ECB can't be reached: the page then shows no estimate. */
export async function getRatesOrNull(): Promise<Rates | null> {
  try {
    return await getRates();
  } catch {
    return null;
  }
}
