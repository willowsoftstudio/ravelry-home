import { describe, expect, it } from "vitest";
import { creditFor, toCard } from "@/lib/ravelry/patterns";

// Photo credit decision (2026-11-12): show only photos we can credit.
const author = { name: "Ann Designer", users: [{ id: 7, username: "anndesigns" }] };
const photo = { user_id: 7, small2_url: "https://images4-a.ravelrycache.com/s2.jpg", medium_url: "https://images4-a.ravelrycache.com/m.jpg", aspect_ratio: 0.75 };

describe("photo credit", () => {
  it("credits the designer by username when the photo is theirs", () => {
    expect(creditFor(photo, author)).toBe("anndesigns");
  });
  it("prefers copyright_holder when set", () => {
    expect(creditFor({ ...photo, copyright_holder: "Studio X for Yarn Co" }, author)).toBe("Studio X for Yarn Co");
  });
  it("returns null for someone else's photo with no copyright line", () => {
    expect(creditFor({ ...photo, user_id: 99 }, author)).toBeNull();
  });
});

describe("pattern card", () => {
  const raw = { id: 1, name: "Sunday Cowl", permalink: "sunday-cowl", free: true, first_photo: photo, pattern_author: author };

  it("keeps a creditable photo with alt text, credit and srcset", () => {
    const card = toCard(raw);
    expect(card.photo).toMatchObject({ credit: "anndesigns", alt: "Sunday Cowl, a pattern by Ann Designer", aspectRatio: 0.75 });
    expect(card.photo?.srcSet).toContain("320w");
  });

  it("leaves out a photo it cannot credit", () => {
    expect(toCard({ ...raw, first_photo: { ...photo, user_id: 99 } }).photo).toBeNull();
  });
});
