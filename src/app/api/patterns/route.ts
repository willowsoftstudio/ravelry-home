import type { NextRequest } from "next/server";
import { ravelryGet } from "@/lib/ravelry/client";
import { errorResponse } from "@/lib/ravelry/route-errors";

// Public pattern search through the server gateway (ISA F2/F3).
// Read-only basic auth; whether it reaches patterns/search is still to be
// verified (specs/ravelry-api-verification.md).

const MAX_PAGE_SIZE = 100; // Ravelry's documented ceiling

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(q.get("page_size")) || 24));
  try {
    const data = await ravelryGet(
      "/patterns/search.json",
      {
        query: q.get("query") ?? undefined,
        page: Number(q.get("page")) || 1,
        page_size: pageSize,
      },
      { kind: "readonly" },
    );
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
