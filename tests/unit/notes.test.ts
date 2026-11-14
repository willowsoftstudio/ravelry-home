import { describe, expect, it } from "vitest";
import { notesLength, parseInline, parseNotes } from "@/lib/ravelry/notes";

// Ravelry notes are Markdown; we keep a safe subset as data and never inject HTML.

describe("parseNotes", () => {
  it("rejoins hard-wrapped quote lines and keeps bold across the wrap", () => {
    expect(parseNotes("> You can get this pattern for **50%\n> OFF** until Nov 22.")).toEqual([
      { type: "quote", inline: [{ t: "text", v: "You can get this pattern for " }, { t: "b", c: [{ t: "text", v: "50% OFF" }] }, { t: "text", v: " until Nov 22." }] },
    ]);
  });

  it("parses headings, paragraphs and both list kinds", () => {
    const blocks = parseNotes("## Materials\r\n\r\n- 1 skein\n- 4 mm needles\n\n1. Cast on\n2. Knit\n\nEnjoy!");
    expect(blocks.map((b) => b.type)).toEqual(["h", "ul", "ol", "p"]);
    expect(blocks[1]).toMatchObject({ items: [[{ t: "text", v: "1 skein" }], [{ t: "text", v: "4 mm needles" }]] });
  });

  it("drops images and horizontal rules", () => {
    expect(parseNotes("![pic](https://x.test/a.jpg)\n\n---\n\nHi")).toEqual([{ type: "p", inline: [{ t: "text", v: "Hi" }] }]);
  });
});

describe("parseInline", () => {
  it("keeps http(s) links and turns other schemes into plain text", () => {
    expect(parseInline("see [site](https://x.test) or [bad](javascript:void0)")).toEqual([
      { t: "text", v: "see " },
      { t: "a", href: "https://x.test", c: [{ t: "text", v: "site" }] },
      { t: "text", v: " or bad" },
    ]);
  });

  it("does not treat snake_case or 2*3*4 as emphasis", () => {
    expect(parseInline("a_b_c and 2*3*4")).toEqual([{ t: "text", v: "a_b_c and 2*3*4" }]);
  });

  it("parses italics", () => {
    expect(parseInline("*soft* yarn")).toEqual([{ t: "i", c: [{ t: "text", v: "soft" }] }, { t: "text", v: " yarn" }]);
  });
});

describe("notesLength", () => {
  it("counts visible text only", () => {
    expect(notesLength(parseNotes("**ab** [cd](https://x.test)\n\n- ef"))).toBe(7);
  });
});
