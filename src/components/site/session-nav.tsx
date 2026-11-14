import { cookies } from "next/headers";
import { connection } from "next/server";
import Link from "next/link";
import { readSession } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/session/cookies";

const control =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold outline-none transition-[background-color,opacity] duration-200 sm:min-h-9 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// Reads the session cookie, so it renders inside <Suspense> (Cache Components).
export async function SessionNav() {
  // Request-time only: the session check uses the clock (Date.now), which Cache
  // Components refuses during prerendering (it crashed the header on /_not-found).
  await connection();
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) {
    return (
      // A plain <a>: this route redirects off-site to Ravelry, which a client-side
      // <Link> navigation can't follow (it tries to fetch an RSC payload).
      <a href="/api/auth/signin" className={`${control} bg-cta text-cta-foreground shadow-(--shadow-raised) hover:opacity-90`}>
        Sign in with Ravelry
      </a>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/me" className={`${control} text-foreground hover:bg-muted`}>
        {session.username}
      </Link>
      <form action="/api/auth/signout" method="post">
        <button type="submit" className={`${control} border border-border bg-card text-foreground shadow-(--shadow-raised) hover:bg-muted`}>
          Sign out
        </button>
      </form>
    </div>
  );
}
