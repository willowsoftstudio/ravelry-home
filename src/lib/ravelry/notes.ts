// Ravelry pattern notes are Markdown. We parse a safe subset into plain data
// (serializable across the 'use cache' boundary) and render it as React elements,
// so Ravelry's notes_html is never injected into our page. Images are dropped;
// only http(s) links survive.

export type Inline =
  | { t: "text"; v: string }
  | { t: "b"; c: Inline[] }
  | { t: "i"; c: Inline[] }
  | { t: "a"; href: string; c: Inline[] };

export type NoteBlock =
  | { type: "p" | "h" | "quote"; inline: Inline[] }
  | { type: "ul" | "ol"; items: Inline[][] };

const LINK = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const BOLD = /(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\1/;
const ITALIC = /(?<![\w*])([*_])(?=\S)([^*_\n]+?)(?<=\S)\1(?![\w*])/;
const AUTOLINK = /<(https?:\/\/[^>\s]+)>/;

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let rest = s;
  while (rest) {
    const hits = [
      { kind: "a", m: LINK.exec(rest) },
      { kind: "auto", m: AUTOLINK.exec(rest) },
      { kind: "b", m: BOLD.exec(rest) },
      { kind: "i", m: ITALIC.exec(rest) },
    ].filter((h): h is { kind: string; m: RegExpExecArray } => h.m !== null);
    if (!hits.length) break;
    const { kind, m } = hits.reduce((a, b) => (b.m.index < a.m.index ? b : a));
    if (m.index > 0) out.push({ t: "text", v: rest.slice(0, m.index) });
    if (kind === "a") {
      const href = /^https?:\/\//i.test(m[2]) ? m[2] : null;
      const c = parseInline(m[1]);
      out.push(...(href ? [{ t: "a" as const, href, c }] : c));
    } else if (kind === "auto") {
      out.push({ t: "a", href: m[1], c: [{ t: "text", v: m[1] }] });
    } else {
      out.push({ t: kind as "b" | "i", c: parseInline(m[2]) });
    }
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) out.push({ t: "text", v: rest });
  // Merge adjacent text runs
  return out.reduce<Inline[]>((acc, n) => {
    const last = acc[acc.length - 1];
    if (n.t === "text" && last?.t === "text") last.v += n.v;
    else acc.push(n);
    return acc;
  }, []);
}

export function parseNotes(md: string | null | undefined): NoteBlock[] {
  if (!md?.trim()) return [];
  const lines = md
    .replace(/\r\n?/g, "\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .split("\n");

  const blocks: NoteBlock[] = [];
  let para: string[] = [];
  let quote: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flush = () => {
    if (para.length) blocks.push({ type: "p", inline: parseInline(para.join(" ")) });
    if (quote.length) blocks.push({ type: "quote", inline: parseInline(quote.join(" ")) });
    if (list) blocks.push({ type: list.type, items: list.items.map(parseInline) });
    para = [];
    quote = [];
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    let m: RegExpExecArray | null;
    if (!line || /^([-*_])(\s*\1){2,}$/.test(line)) {
      flush();
    } else if ((m = /^#{1,6}\s+(.*?)\s*#*$/.exec(line))) {
      flush();
      blocks.push({ type: "h", inline: parseInline(m[1]) });
    } else if ((m = /^>\s?(.*)$/.exec(line))) {
      if (!quote.length) flush();
      if (m[1].trim()) quote.push(m[1].trim());
      else if (quote.length) flush();
    } else if ((m = /^(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(line))) {
      const type = m[1] ? "ul" : "ol";
      if (!list || list.type !== type) {
        flush();
        list = { type, items: [] };
      }
      list.items.push(m[3]);
    } else if (list && /^\s{2,}/.test(raw)) {
      list.items[list.items.length - 1] += ` ${line}`; // wrapped list item
    } else {
      if (list || quote.length) flush();
      para.push(line);
    }
  }
  flush();
  return blocks.filter((b) => ("inline" in b ? b.inline.length : b.items.length));
}

/** Rough length of the visible text, to decide whether to collapse long notes. */
export function notesLength(blocks: NoteBlock[]): number {
  const len = (xs: Inline[]): number => xs.reduce((n, x) => n + (x.t === "text" ? x.v.length : len(x.c)), 0);
  return blocks.reduce((n, b) => n + ("inline" in b ? len(b.inline) : b.items.reduce((k, i) => k + len(i), 0)), 0);
}
