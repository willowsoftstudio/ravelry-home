import { cookies } from "next/headers";
import Link from "next/link";
import { readSession } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/session/cookies";

const control =
  "inline-flex min-h-11 items-center rounded-lg px-4 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// Reads the session cookie, so it renders inside <Suspense> (Cache Components).
export async function SessionNav() {
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) {
    return (
      <Link href="/api/auth/signin" prefetch={false} className={`${control} bg-cta text-cta-foreground hover:opacity-90`}>
        Sign in with Ravelry
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/me" className={`${control} text-foreground hover:bg-muted`}>
        {session.username}
      </Link>
      <form action="/api/auth/signout" method="post">
        <button type="submit" className={`${control} border border-input text-foreground hover:bg-muted`}>
          Sign out
        </button>
      </form>
    </div>
  );
}
