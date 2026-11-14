import Link from "next/link";
import { Suspense } from "react";
import { SessionNav } from "./session-nav";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    // Frosted, sticky header floating over the ambient background (reskin 2026-11-13).
    <header className="glass sticky top-0 z-40 border-x-0! border-t-0!">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md font-heading text-2xl font-semibold tracking-[-0.02em] text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {siteConfig.name}
        </Link>
        <nav aria-label="Main" className="mr-auto ml-4 hidden sm:block">
          <Link
            href="/patterns"
            className="inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Patterns
          </Link>
        </nav>
        {/* Same-size placeholder so the header doesn't shift while the session streams in */}
        <Suspense fallback={<div className="min-h-11 w-40" aria-hidden="true" />}>
          <SessionNav />
        </Suspense>
      </div>
    </header>
  );
}
