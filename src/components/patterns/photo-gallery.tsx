"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { CardPhoto } from "@/lib/ravelry/patterns";

// Pattern photo gallery: swipe (scroll-snap) on touch, arrows and thumbnails
// everywhere, tap to open a full-screen viewer. Only creditable photos reach here
// (Decision 2026-11-12) and the visible credit follows the current photo (ISC-25).
// Every control is at least 44x44 px (ISC-13) with a 2 px focus ring (ISC-56).

const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const arrow = `glass-strong absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground transition-[opacity,background-color] duration-200 hover:bg-card disabled:opacity-0 ${ring}`;
const inlineArrow = `${arrow} sm:size-9 [&_svg]:size-4`;

export function PhotoGallery({ photos, name }: { photos: CardPhoto[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const count = photos.length;

  const go = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const el = track.current;
      const next = Math.max(0, Math.min(count - 1, i));
      el?.scrollTo({ left: next * el.clientWidth, behavior });
      setIndex(next);
    },
    [count],
  );

  // Swiping moves the track; follow it so the counter, credit and thumbnails stay in sync.
  function onScroll() {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  useEffect(() => {
    thumbs.current?.querySelector<HTMLElement>(`[data-thumb="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [index]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    go(index + (e.key === "ArrowRight" ? 1 : -1));
  }

  if (!count) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground md:aspect-[4/5] md:h-auto">
        No creditable photo
      </div>
    );
  }

  const current = photos[index];

  return (
    <section aria-roledescription="carousel" aria-label={`Photos of ${name}`} className="flex min-w-0 flex-col gap-2" onKeyDown={onKeyDown}>
      <div className="relative">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex aspect-square snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl bg-muted shadow-(--shadow-raised) ring-1 ring-glass-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((ph, i) => (
            <button
              key={ph.src}
              type="button"
              onClick={() => {
                setIndex(i);
                setOpen(true);
              }}
              aria-label={`Enlarge photo ${i + 1} of ${count}`}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
              className={`relative h-full w-full shrink-0 snap-center cursor-zoom-in ${ring} focus-visible:ring-inset`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Ravelry's CDN serves sized images (see pattern-card.tsx) */}
              <img
                src={ph.src}
                srcSet={ph.srcSet || undefined}
                sizes="(min-width: 768px) 50vw, 100vw"
                alt={ph.alt}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
        {count > 1 ? (
          <>
            <button type="button" className={`${inlineArrow} left-2 hidden sm:flex`} onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous photo">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className={`${inlineArrow} right-2 hidden sm:flex`} onClick={() => go(index + 1)} disabled={index === count - 1} aria-label="Next photo">
              <ChevronRight aria-hidden="true" />
            </button>
            <span className="glass-strong pointer-events-none absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
        <span className="glass-strong pointer-events-none absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-md text-foreground" aria-hidden="true">
          <Expand className="size-3.5" />
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground" aria-live="polite" data-photo-credit>
        Photo: {current.credit}
      </p>

      {count > 1 ? (
        <div ref={thumbs} className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]" role="group" aria-label="Choose a photo">
          {photos.map((ph, i) => (
            <button
              key={ph.src}
              type="button"
              data-thumb={i}
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index ? "true" : undefined}
              className={`size-14 shrink-0 overflow-hidden rounded-md border-2 transition-[opacity,border-color] duration-200 ${i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"} ${ring}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
              <img src={ph.srcSet.split(" ")[0] || ph.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Lightbox photos={photos} index={index} open={open} onOpenChange={setOpen} onIndex={(i) => go(i, "instant")} name={name} />
    </section>
  );
}

function Lightbox({
  photos,
  index,
  open,
  onOpenChange,
  onIndex,
  name,
}: {
  photos: CardPhoto[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndex: (i: number) => void;
  name: string;
}) {
  const count = photos.length;
  const ph = photos[index];
  const startX = useRef<number | null>(null);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight" && index < count - 1) onIndex(index + 1);
    else if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay/90 backdrop-blur-md data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col bg-overlay/95 text-overlay-foreground outline-none data-open:animate-in data-open:fade-in-0"
        >
          <div className="flex items-center justify-between gap-4 p-2 pl-4">
            <DialogPrimitive.Title className="truncate text-sm font-semibold">
              {name} · {index + 1} / {count}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className={`flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-overlay-foreground/10 ${ring} focus-visible:ring-overlay-foreground focus-visible:ring-offset-overlay`}>
              <X aria-hidden="true" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-2"
            onPointerDown={(e) => (startX.current = e.clientX)}
            onPointerUp={(e) => {
              if (startX.current === null) return;
              const dx = e.clientX - startX.current;
              startX.current = null;
              if (dx < -40 && index < count - 1) onIndex(index + 1);
              else if (dx > 40 && index > 0) onIndex(index - 1);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img
              key={ph.src}
              src={ph.src}
              srcSet={ph.srcSet || undefined}
              sizes="100vw"
              alt={ph.alt}
              draggable={false}
              className="max-h-full max-w-full touch-pan-y object-contain select-none"
            />
            {count > 1 ? (
              <>
                <button type="button" className={`${arrow} left-2`} onClick={() => onIndex(index - 1)} disabled={index === 0} aria-label="Previous photo">
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button type="button" className={`${arrow} right-2`} onClick={() => onIndex(index + 1)} disabled={index === count - 1} aria-label="Next photo">
                  <ChevronRight aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>
          <DialogPrimitive.Description className="p-4 text-center text-sm text-overlay-foreground/80">Photo: {ph.credit}</DialogPrimitive.Description>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
