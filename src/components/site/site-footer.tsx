import { siteConfig } from "@/config/site";

// Every page carries the non-affiliation notice (ISA ISC-5).
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-section-alt">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground sm:px-6">
        <p>
          {siteConfig.name} · {siteConfig.attribution}
        </p>
      </div>
    </footer>
  );
}
