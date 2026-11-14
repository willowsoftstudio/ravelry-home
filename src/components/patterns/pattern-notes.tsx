"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { notesLength, type Inline, type NoteBlock } from "@/lib/ravelry/notes";

// The pattern description, rendered from parsed Markdown blocks (never HTML from
// Ravelry). Long notes start collapsed behind a fade with a "Show full description"
// toggle, so the key facts and the Buy button stay near the top on a phone.

const COLLAPSE_OVER = 700; // visible characters

function InlineView({ nodes }: { nodes: Inline[] }): ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "b":
        return <strong key={i}>{<InlineView nodes={n.c} />}</strong>;
      case "i":
        return <em key={i}>{<InlineView nodes={n.c} />}</em>;
      case "a":
        return (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer nofollow ugc" className="font-semibold text-primary underline underline-offset-2 hover:no-underline">
            <InlineView nodes={n.c} />
          </a>
        );
    }
  });
}

function Block({ block }: { block: NoteBlock }) {
  switch (block.type) {
    case "h":
      return (
        <h3 className="pt-2 text-base font-semibold text-foreground">
          <InlineView nodes={block.inline} />
        </h3>
      );
    case "quote":
      return (
        <p className="border-l-2 border-primary pl-4 text-foreground">
          <InlineView nodes={block.inline} />
        </p>
      );
    case "ul":
    case "ol": {
      const List = block.type;
      return (
        <List className={`flex flex-col gap-1 pl-6 ${block.type === "ul" ? "list-disc" : "list-decimal"}`}>
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineView nodes={item} />
            </li>
          ))}
        </List>
      );
    }
    default:
      return (
        <p>
          <InlineView nodes={block.inline} />
        </p>
      );
  }
}

export function PatternNotes({ blocks }: { blocks: NoteBlock[] }) {
  const long = notesLength(blocks) > COLLAPSE_OVER;
  const [expanded, setExpanded] = useState(!long);
  const id = useId();
  if (!blocks.length) return null;

  return (
    <section aria-labelledby={`${id}-h`} className="flex flex-col gap-3">
      <h2 id={`${id}-h`} className="text-2xl text-primary">
        About this pattern
      </h2>
      <div className="relative">
        <div
          id={`${id}-body`}
          className={`flex flex-col gap-3 text-[15px] leading-7 text-foreground/90 break-words ${expanded ? "" : "max-h-72 overflow-hidden"}`}
        >
          {blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
        {!expanded ? <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-section-alt to-transparent" /> : null}
      </div>
      {long ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`${id}-body`}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex min-h-11 items-center gap-1 self-start rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-(--shadow-raised) outline-none transition-colors duration-200 hover:bg-muted sm:min-h-9 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {expanded ? "Show less" : "Show full description"}
          <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      ) : null}
    </section>
  );
}
