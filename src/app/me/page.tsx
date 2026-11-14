import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { WorkspaceCard } from "@/components/me/workspace-card";
import { isAllowlisted } from "@/lib/auth/config";
import { readSession } from "@/lib/auth/session";
import { RavelryError } from "@/lib/ravelry/client";
import { errorResponse } from "@/lib/ravelry/route-errors";
import { getCounts, getList, TAB_LABELS, TABS, type Tab, type WorkspaceList } from "@/lib/ravelry/workspace";
import { SESSION_COOKIE } from "@/lib/session/cookies";

export const metadata: Metadata = { title: "Your Ravelry" };

// Signed-in workspace (ISA ISC-32, architecture: Workspace): five tabs, each labelled
// with its list's paginator total. Tab and page live in the URL. src/proxy.ts has
// already refreshed the token when it was about to expire.

const control =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold outline-none transition-[background-color,color,box-shadow,opacity] duration-200 sm:min-h-9 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function MePage({ searchParams }: PageProps<"/me">) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-8 pb-16 sm:px-6" data-density="workspace">
      <Suspense fallback={<Skeleton />}>
        <Workspace searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function parseTab(v: string | string[] | undefined): Tab {
  const s = Array.isArray(v) ? v[0] : v;
  return TABS.includes(s as Tab) ? (s as Tab) : "projects";
}

function parsePage(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : 1;
}

const href = (tab: Tab, page = 1) => `/me?tab=${tab}${page > 1 ? `&page=${page}` : ""}`;

async function Workspace({ searchParams }: Pick<PageProps<"/me">, "searchParams">) {
  await connection(); // the session check uses the clock (see SessionNav)
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return <SignInPrompt />;
  if (!isAllowlisted(session.username)) {
    return (
      <Notice title="Not in the beta yet">
        Signed in as {session.username}, but this account isn&rsquo;t on the beta list.
      </Notice>
    );
  }

  const sp = await searchParams;
  const tab = parseTab(sp.tab);
  const page = parsePage(sp.page);

  let list: WorkspaceList | null = null;
  let error: string | null = null;
  let expired = false;
  const [listResult, counts] = await Promise.all([
    getList(session, tab, page).then(
      (l) => ({ ok: true as const, l }),
      (e: unknown) => ({ ok: false as const, e }),
    ),
    getCounts(session, tab),
  ]);
  if (listResult.ok) {
    list = listResult.l;
    counts[tab] = list.total;
  } else if (listResult.e instanceof RavelryError && listResult.e.status === 401) {
    expired = true;
  } else {
    const body = (await errorResponse(listResult.e).json()) as { message?: string };
    error = body.message ?? "Ravelry could not load this list.";
  }

  if (expired) return <SignInPrompt expired />;

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl text-primary sm:text-4xl">Your Ravelry</h1>
        <p className="text-sm text-muted-foreground">Signed in as {session.username}</p>
      </header>

      <nav aria-label="Your lists" className="-mx-4 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:-mx-6 sm:px-6">
        <ul className="inline-flex gap-0.5 rounded-lg border border-border bg-muted p-0.5">
          {TABS.map((t) => {
            const current = t === tab;
            const count = counts[t];
            return (
              <li key={t}>
                <Link
                  href={href(t)}
                  aria-current={current ? "page" : undefined}
                  data-tab={t}
                  data-count={count ?? undefined}
                  className={`${control} rounded-md whitespace-nowrap ${current ? "bg-card text-foreground shadow-(--shadow-raised)" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {TAB_LABELS[t]}
                  <span className={`rounded-full px-1.5 text-[11px] leading-5 tabular-nums ${current ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                    {count === null ? "–" : count.toLocaleString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {error ? (
        <p role="alert" className="rounded-lg border border-border bg-card p-4 text-sm shadow-(--shadow-raised)">
          {error} Try again in a moment.
        </p>
      ) : list && list.items.length === 0 ? (
        <EmptyTab tab={tab} />
      ) : list ? (
        <>
          <ul data-testid="workspace-items" className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.items.map((item, i) => (
              <WorkspaceCard key={item.key} item={item} priority={i < 2} />
            ))}
          </ul>
          {list.pageCount > 1 ? (
            <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
              {page > 1 ? (
                <Link href={href(tab, page - 1)} className={`${control} border border-border bg-card shadow-(--shadow-raised) hover:bg-muted`}>
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-muted-foreground">
                Page {list.page} of {list.pageCount}
              </span>
              {page < list.pageCount ? (
                <Link href={href(tab, page + 1)} className={`${control} border border-border bg-card shadow-(--shadow-raised) hover:bg-muted`}>
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function EmptyTab({ tab }: { tab: Tab }) {
  const text: Record<Tab, string> = {
    projects: "No projects yet.",
    queue: "Your queue is empty. Patterns you queue on Ravelry show up here.",
    stash: "No yarn in your stash yet.",
    favorites: "No favorites yet.",
    library: "Your library is empty. Patterns you buy on Ravelry show up here.",
  };
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-input p-6 text-sm">
      <p>{text[tab]}</p>
      {tab === "queue" || tab === "favorites" ? (
        <Link href="/patterns" className={`${control} border border-border bg-card shadow-(--shadow-raised) hover:bg-muted`}>
          Browse patterns
        </Link>
      ) : null}
    </div>
  );
}

function SignInPrompt({ expired = false }: { expired?: boolean }) {
  return (
    <Notice title={expired ? "Please sign in again" : "Sign in to see your Ravelry"}>
      {expired
        ? "Your Ravelry sign-in has expired."
        : "Your projects, queue, stash, favorites and library live here once you sign in."}
      <a href="/api/auth/signin?returnTo=/me" className={`${control} mt-2 bg-cta text-cta-foreground shadow-(--shadow-raised) hover:opacity-90`}>
        Sign in with Ravelry
      </a>
    </Notice>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-strong mx-auto my-10 flex w-full max-w-sm flex-col items-start gap-2 rounded-xl p-6">
      <h1 className="text-2xl text-primary">{title}</h1>
      <p className="flex flex-col items-start gap-2 text-sm text-muted-foreground">{children}</p>
    </section>
  );
}

function Skeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-10 w-full max-w-md rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
