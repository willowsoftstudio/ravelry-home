// Single source of truth for the site's name and identity (ISA ISC-82, ISC-83).
// The name is not a secret, so it may be inlined into client bundles.
// NEXT_PUBLIC_* values are inlined at build time, so a rename via the
// environment variable needs a redeploy but no code change.
// Keep the direct `process.env.NEXT_PUBLIC_SITE_NAME` reference: Next.js only
// inlines direct references, not dynamic lookups.

const DEFAULT_SITE_NAME = "Niddy";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || DEFAULT_SITE_NAME,
  description:
    "A fast, mobile-first companion for finding patterns and yarn, tracking your crafting, and talking with friends.",
  attribution: "Powered by the Ravelry API, not affiliated with Ravelry.",
} as const;
