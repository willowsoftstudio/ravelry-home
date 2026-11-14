import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { PatternCard as Card } from "@/lib/ravelry/patterns";

// Photo-first result card (ISA ISC-24, ISC-25). Photos load straight from Ravelry's
// image CDN at the size Ravelry already serves (320/500/640 px), so there is no
// image optimizer cost; the box reserves the aspect ratio to keep CLS at 0.
export function PatternCard({ pattern, priority = false }: { pattern: Card; priority?: boolean }) {
  const { photo } = pattern;
  return (
    <li className="group flex flex-col gap-1.5">
      <Link
        href={`/patterns/${pattern.id}`}
        className="flex flex-1 flex-col gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted shadow-(--shadow-raised) ring-1 ring-glass-border transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-(--shadow-float)">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- Ravelry's CDN serves sized images; see comment above
            <img
              src={photo.src}
              srcSet={photo.srcSet || undefined}
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              alt={photo.alt}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
              <ImageOff aria-hidden="true" className="size-5 opacity-60" />
              No creditable photo
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-1">
          <span className="line-clamp-2 text-sm font-semibold leading-snug decoration-primary/50 underline-offset-2 group-hover:underline">{pattern.name}</span>
          <span className="text-xs text-muted-foreground">{pattern.designer}</span>
          {pattern.free ? (
            <span className="mt-1 inline-flex self-start rounded-full bg-teal/10 px-2 py-px text-[11px] font-semibold text-teal ring-1 ring-teal/25">Free</span>
          ) : null}
        </div>
      </Link>
      {photo ? (
        <p className="px-1 text-[11px] text-muted-foreground" data-photo-credit>
          Photo: {photo.credit}
        </p>
      ) : null}
    </li>
  );
}
