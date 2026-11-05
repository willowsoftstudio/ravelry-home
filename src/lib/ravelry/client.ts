import "server-only";

// Server-only Ravelry API client (ISA F2). Importing this from a Client
// Component fails the build (ISC-72), so credentials never reach the browser.

const DEFAULT_BASE = "https://api.ravelry.com";
const TIMEOUT_MS = 10_000; // Ravelry returns 504 past 10 s anyway

export class RavelryError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(`Ravelry API responded ${status}`);
    this.name = "RavelryError";
  }
}

export type RavelryAuth = { kind: "readonly" } | { kind: "bearer"; accessToken: string };

function baseUrl(): string {
  return (process.env.RAVELRY_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");
}

function authHeader(auth: RavelryAuth): string {
  if (auth.kind === "bearer") return `Bearer ${auth.accessToken}`;
  const user = process.env.RAVELRY_READONLY_USERNAME;
  const pass = process.env.RAVELRY_READONLY_PASSWORD;
  if (!user || !pass) throw new Error("Ravelry read-only credentials are not configured");
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds;
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.ceil((date - Date.now()) / 1000);
}

/** GET a Ravelry API path (e.g. "/patterns/search.json") and return its JSON body. */
export async function ravelryGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  auth: RavelryAuth,
): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: { Authorization: authHeader(auth), Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new RavelryError(res.status, parseRetryAfter(res.headers.get("retry-after")));
  return (await res.json()) as T;
}
