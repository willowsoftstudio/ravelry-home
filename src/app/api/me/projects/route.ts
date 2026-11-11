import { withSession } from "@/lib/auth/session";
import { ravelryGet } from "@/lib/ravelry/client";

// The signed-in user's projects (ISA F4). page_size is always sent: Ravelry
// returns the entire set in one page when it is omitted.
export const GET = withSession((session, request) => {
  const page = Number(request.nextUrl.searchParams.get("page")) || 1;
  return ravelryGet(
    `/projects/${encodeURIComponent(session.username)}/list.json`,
    { page, page_size: 50, extras: 1 },
    { kind: "bearer", accessToken: session.accessToken },
  );
});
