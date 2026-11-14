import type { NextRequest } from "next/server";
import { parsePatternSearch } from "@/lib/ravelry/pattern-search-params";
import { searchPatterns } from "@/lib/ravelry/patterns";
import { errorResponse } from "@/lib/ravelry/route-errors";

// Public pattern search (ISA F3). Only whitelisted filters reach Ravelry.
// Cached at the CDN for up to 300 s (ISC-78).
export async function GET(request: NextRequest) {
  try {
    const data = await searchPatterns(parsePatternSearch(request.nextUrl.searchParams));
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
