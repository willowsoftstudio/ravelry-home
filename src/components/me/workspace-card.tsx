import Link from "next/link";
import type { WorkspaceItem } from "@/lib/ravelry/workspace";

// One item in a /me tab. Patterns open our own page; projects and stash open on
// ravelry.com until their detail pages exist. Photos credit anyone but the viewer (ISC-25).
export function WorkspaceCard({ item, priority = false }: { item: WorkspaceItem; priority?: boolean }) {
  const body = (
    <>
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted shadow-(--shadow-raised) ring-1 ring-glass-border transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-(--shadow-float)">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- Ravelry's CDN serves sized images (see pattern-card.tsx)
          <img
            src={item.photo.src}
            srcSet={item.photo.srcSet || undefined}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">No photo</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-1">
        <span className="line-clamp-2 text-sm font-semibold leading-snug decoration-primary/50 underline-offset-2 group-hover:underline">{item.title}</span>
        {item.subtitle ? <span className="line-clamp-1 text-xs text-muted-foreground">{item.subtitle}</span> : null}
        {item.meta ? <span className="mt-1 inline-flex self-start rounded-full bg-muted px-2 py-px text-[11px] font-semibold text-muted-foreground">{item.meta}</span> : null}
        {item.external ? <span className="sr-only"> (opens on Ravelry)</span> : null}
      </div>
    </>
  );
  const cls =
    "flex flex-1 flex-col gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  return (
    <li className="group flex flex-col gap-1.5">
      {item.href ? (
        item.external ? (
          <a href={item.href} className={cls}>
            {body}
          </a>
        ) : (
          <Link href={item.href} className={cls}>
            {body}
          </Link>
        )
      ) : (
        <div className="flex flex-1 flex-col gap-2.5">{body}</div>
      )}
      {item.photo?.credit ? (
        <p className="px-1 text-[11px] text-muted-foreground" data-photo-credit>
          Photo: {item.photo.credit}
        </p>
      ) : null}
    </li>
  );
}
