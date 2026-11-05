import "server-only";
import { RavelryError } from "./client";

const DEFAULT_RETRY_AFTER = 30;

/** Clamp a retry hint to the 1..120 s window the site promises (ISA ISC-21). */
export function retryAfterSeconds(upstream?: number): number {
  const s = Math.ceil(upstream ?? DEFAULT_RETRY_AFTER);
  return Math.min(120, Math.max(1, Number.isFinite(s) ? s : DEFAULT_RETRY_AFTER));
}

/** Map a gateway failure to the site's own API response. */
export function errorResponse(err: unknown): Response {
  if (err instanceof RavelryError && err.status === 429) {
    return Response.json(
      { error: "rate_limited", message: "Ravelry is busy. Try again shortly." },
      { status: 503, headers: { "Retry-After": String(retryAfterSeconds(err.retryAfterSeconds)) } },
    );
  }
  if (err instanceof RavelryError && (err.status === 503 || err.status === 504)) {
    return Response.json(
      { error: "upstream_unavailable", message: "Ravelry is not answering right now." },
      { status: 503, headers: { "Retry-After": String(retryAfterSeconds()) } },
    );
  }
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return Response.json(
      { error: "upstream_timeout", message: "Ravelry took too long to answer." },
      { status: 504 },
    );
  }
  return Response.json({ error: "upstream_error" }, { status: 502 });
}
