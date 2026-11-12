---
isa_format: 1.0
title: "Ravelry companion site v1 (private beta)"
slug: ravelry-companion-site
status: aligned
principal: "The requester (project owner at /home/jhollenbeck/ravelry), who also leads the small invited private-beta group"
created: 2026-11-01
updated: 2026-11-11
progress: 21/75
---

## Ideal State

### L3 · One sentence

The principal and a small invited group open one fast, accessible, mobile-first site instead of ravelry.com every day to find patterns and yarns, track their own crafting, talk with friends, and buy patterns, all through Ravelry's official API on one shared design system.

### L2 · Summary

One approved architecture, deployed on Vercel, puts a thin, server-only gateway to the Ravelry API under one ui-ux-pro-max design system, and four focused areas sit on top, each faster and clearer than ravelry.com for the same task.

- Anyone with a link can search patterns and yarns with photo-first results, thumb-friendly filter chips, owner-credited photos, rich detail pages and yarn substitutes that explain each match, without signing in.
- After Ravelry OAuth 2.0 sign-in, allowlisted users edit projects, queue, stash and favorites in one or two taps, browse their library, and each change is confirmed against Ravelry's response as the only source of truth.
- Signed-in users read and reply in forums, messages and friend activity, and buy a pattern on Ravelry in one tap from its page, then open the download on the same site.
- It feels instant on a mid-range phone, works fully by keyboard and screen reader to WCAG 2.2 AA, and stays a private, credited, unaffiliated client that Ravelry would recognise as a model API citizen.

### L1 · Full articulation

On a Saturday morning the principal stands in a yarn shop with a skein of fingering-weight merino in one hand and a phone in the other, and opens this site rather than ravelry.com. The first screen is a search bar over large pattern photos. They type "shawl", and a grid of well-cropped photos fills the screen. A filter sheet slides up from the bottom of the screen, with chips for craft, category, yarn weight, yardage, needle size, free or paid, difficulty, attributes and designer. The chips are big enough to tap with a thumb, and the result count updates as each chip changes. The active filters stay visible above the grid as chips that remove with one tap, and the full search state is in the URL, so a search can be shared or bookmarked. A pattern page shows the photos first, then the facts a knitter needs in the shop: yardage, gauge, sizes, needle size, suggested yarns and difficulty. Each photo credits its owner, and the page links back to the pattern on Ravelry. A yarn page has a "Find substitutes" action that ranks yarns by weight, fiber and gauge, and states the reason for each match in plain words. This takes less than a minute, where on ravelry.com it took several pinch-zooms and a lost browser tab. All of it works without sign-in, so a friend with a shared link can browse.

Later on the couch, mid-row, the principal signs in with Ravelry once, and the site remembers them on that device. The workspace at /me opens on what they are knitting now, with tabs for Projects, Queue, Stash, Favorites and Library that use the same cards, spacing and type. They move a project's progress, add a photo of the finished yoke if the API permits uploads, and mark a queued pattern as started, each in one or two taps. Every write goes through the server gateway, which checks the session, the beta allowlist and the OAuth scope, sends the request, and confirms the result against Ravelry's response before a quiet confirmation says it was saved. When Ravelry rejects, rate-limits or does not answer a write, the user sees what was not saved and how to retry. Ravelry stays the only source of truth: the site caches reads to be fast and polite, but it never keeps a separate copy that can diverge. That evening the same data is on ravelry.com.

The invited friends find the community area restful. Forum threads read like a clean conversation, not a dense table, and the reply box stays usable on a small screen. Private messages and friend activity are one tab away, and a friend's new finished object shows with its photo, so the user can favorite the pattern behind it without leaving the feed. On a pattern for sale, the page shows the price from Ravelry and a Buy on Ravelry button that opens the pattern's own purchase page on ravelry.com, because Ravelry's cart API only serves seller stores. The site never handles card data or carts. Back on the site, the purchased pattern is in the Library, and its PDF opens with one tap.

Under every page is one documented design system, generated with the ui-ux-pro-max plugin, approved by the principal and persisted in the repo: a sleek, modern palette on one neutral scale, light and charcoal dark, with terracotta as the single brand accent so the photos stay the color, a type scale, spacing and radius tokens, and shadcn/ui components set to those tokens. No page uses its own styling, and a check fails any page that adds off-system styles. Automated axe checks hold every page to WCAG 2.2 AA, including keyboard and screen-reader use, focus visibility, contrast and target size. Performance budgets on a mid-range mobile profile (LCP at or under 2.5s, INP at or under 200ms, CLS at or under 0.1, and fast search updates) block a merge when a page regresses. Under the design system is a narrow server-only gateway: Next.js route handlers and server components hold the OAuth 2.0 tokens and the read-only credentials, refresh tokens, apply rate limits with backoff, cache responses and add attribution. Tokens sit in a server-side store referenced only by an encrypted httpOnly session cookie and are destroyed on sign-out. An automated scan of client bundles, HTML responses, cookies and browser storage proves on every build that no credential reaches the browser, and secret files are gitignored from the first commit.

The site runs on Vercel. Every pull request gets a protected preview deployment, and main ships to production. Secrets live only in Vercel environment variables, never under a NEXT_PUBLIC_ name. Signed-in pages and /api/me routes are never cached at Vercel's edge, while public pattern and yarn reads are cached for at most five minutes, so the site is fast and polite to Ravelry at the same time. Before any feature is built, one architecture document covers all four areas end to end: the design system, the gateway, sessions, caching, the Vercel runtime per route, the workspace write-back pattern, the community polling strategy for unread messages, and the purchasing hand-off. The principal approves it, so purchasing and messaging are designed in from day one rather than bolted on.

The scope is sharp on purpose. This is a private beta for the principal and an allowlist of Ravelry usernames, with public pages kept unindexed. It is not a public launch, a marketing site, a native app or a seller tool. It is non-commercial, with no ads, fees, subscriptions or affiliate links. It has its own neutral name and identity, a "Powered by the Ravelry API, not affiliated with Ravelry" notice, and credit to Ravelry and each photo owner, so nobody mistakes it for Ravelry. It uses only the official, documented API and never scraped HTML, so Ravelry sees a well-behaved client. Because the API docs need a login, a verification spike with a logged-in developer account confirms each endpoint family, OAuth scope, rate limit, photo upload, forum and message write, and library and delivery access before any build depends on it. A capability that the live API does not confirm stays behind a flag and is left out of v1, with no workaround. Build order follows the dependencies: design system and gateway first, then discovery, workspace, community and purchasing, each complete before the next starts. So the beta always has a site that is better to use than ravelry.com, never a broad but shallow copy, and future developers and agents find one design source, one gateway, and an ISA that says what done means.

## Problem

Ravelry.com is the main home for knitters' and crocheters' patterns, yarn data, projects, stash and community, but its interface is dense, dated and built for desktop first. On a phone it is hard to search and filter patterns, compare yarns, or update a project or queue in the moment (at the yarn shop, mid-project on the couch). The principal and a small group of fiber-craft users carry this friction every day. No alternative client exists in this project yet: the directory is empty, has no design system, and the API docs sit behind a Ravelry login, so the API facts are still unverified.

## Out of Scope

- **Public launch, marketing site, or open sign-up.** Principal set the audience as personal / private beta (principal plus a small invited group)
- **Monetization or any commercial use (ads, subscriptions, fees, affiliate links).** Ravelry terms forbid commercial use without permission, and the beta is personal
- **Scraping ravelry.com HTML or using undocumented endpoints.** Ravelry terms forbid scraping; all data comes through the official API
- **Branding that implies Ravelry endorsement or copies Ravelry's identity.** Ravelry terms forbid implied endorsement
- **Exposing OAuth tokens or API keys to the browser.** Principal required server-side route handlers to hold tokens
- **Handling payment card data or running a separate payment processor.** Buying happens on ravelry.com through a Buy on Ravelry hand-off
- **A separate data store that replaces Ravelry as source of truth (offline-first sync, own pattern database).** Edits are written back to Ravelry; nothing in the request asks for an independent data copy (caching is allowed)
- **Native iOS/Android apps.** Request is for a site; mobile needs are met by a mobile-first web UI
- **Writing application code in this step.** The ISA is the planning artifact before any code is written
- **An in-site cart or checkout.** Ravelry's cart API (carts/*) only serves seller stores with a Ravelry-issued store_id; buying happens on ravelry.com
- **Designer/seller tools (publishing or selling one's own patterns, shop management).** Not requested; purchasing scope is buyer-side

## Principles

- Faster and clearer than ravelry.com for the same task beats feature parity with ravelry.com
- Mobile-first beats desktop density
- Photo-forward browsing beats text-dense tables
- Ravelry terms compliance and token safety beat convenience features
- One shared design system beats per-page custom styling
- Ravelry stays the source of truth: write back through the API rather than keep a divergent local copy

## Constraints

- Stack: Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui
- OAuth tokens and API credentials live only on the server (route handlers/server code); they never reach the browser or client bundles
- Authentication: Ravelry OAuth 2.1 with PKCE (S256) at https://auth.ravelry.com/oauth2/auth and /oauth2/token for signed-in features, client id and secret in the Authorization header, scopes offline_access forum-write message-write deliveries-read, with library-pdf on a separate, shorter-lived token; public browse uses server-side read-only basic-auth credentials (if the docs confirm they reach pattern and yarn search)
- UI/UX must be generated with the installed ui-ux-pro-max plugin (ui-ux-pro-max, design-system, ui-styling skills); the design system (tokens, typography, color, components) is documented and persisted in the repo, and every page uses it
- Mobile-first responsive layout
- Accessibility: WCAG 2.2 AA
- Fast: performance budgets for page loads and search interactions (exact numbers to be set in criteria)
- Ravelry terms of use: no implied Ravelry endorsement, attribute Ravelry and photo owners, respect rate limits, no commercial use without permission, no scraping of ravelry.com HTML
- Private beta audience only: no public launch in v1
- API facts in the brief are unverified (docs need a Ravelry login) and must be verified against the live docs/API before build criteria depend on them
- Greenfield: the project directory has no application code yet
- ISA must live at specs/isa/<slug>.isa.md and follow format v1.0: frontmatter, required sections (Ideal State, Problem, Out of Scope, Features, Test Strategy, Articulation Log), L3 one sentence, L2 one sentence plus exactly 4 bullets, six-column Test Strategy table, global never-renumbered ISC IDs
- Soft gate: keep the ISA at or under 40 live criteria (scope-heavy) and at or under 25% manual rows. This pushes back on the four-area v1 scope (discovery, workspace, community, purchasing)
- Test Strategy tool cells must not use absolute filesystem paths (abs-path warning)
- Each testable Out of Scope item needs an Anti: criterion (for example: no Ravelry endorsement implied, no scraping of ravelry.com, no tokens in the browser, no commercial use)
- Design system output must be persisted in the repo (design-system/<slug>/MASTER.md via ui-ux-pro-max --persist) and used by every page
- OAuth tokens must stay server-side (Next.js route handlers/server components), never in client bundles or localStorage
- Ravelry API terms: attribute Ravelry and photo owners, respect rate limits, no implied endorsement, no commercial use without permission, no website scraping
- Accessibility target is WCAG 2.2 AA, with mobile-first layout
- Repo layout: app code lives under src/ (src/app, src/components, src/lib); the only theme token file is src/app/globals.css; helper scripts live under scripts/; tests live under tests/unit, tests/gateway and tests/e2e
- Test harness: vitest runs unit and gateway tests (`pnpm test <path>`); Playwright runs e2e tests (`pnpm test:e2e <spec> --project=<name>`) with projects mobile-360 (360x780), mobile-375 (375x812), mobile-390 (390x844) and desktop; Playwright's webServer config starts and stops the app for every e2e run, so no test row starts a server by hand
- Every negative grep in the Test Strategy is guarded by a `test -d` / `test -f` on its target, so a missing directory fails the check instead of passing it
- Hosting: Vercel. Production deploys from main; every pull request gets a preview deployment behind Vercel Deployment Protection. PROD_URL, PREVIEW_URL and VERCEL_AUTOMATION_BYPASS_SECRET are supplied to the deploy checks as environment variables
- Secrets live only in Vercel environment variables (production and preview), with every key listed in .env.example; no secret uses a NEXT_PUBLIC_ name
- Vercel caching: responses for signed-in pages and /api/me/* are never cached at the edge; public Ravelry reads are cached for at most 300 s
- All four v1 areas (discovery, workspace, community including messaging, purchasing) are designed in one approved architecture before any feature is built
- Ravelry API limits: page_size at most 100 (friends activity 50); a response slower than 10 s returns 504; send ETags (If-None-Match) on cached reads; never poll forum_posts/unread; follow Ravelry's "Polling for unread messages" guide for the message badge
- Sessions: no server-side store. The session (Ravelry tokens, username, expiry) is sealed with AES-256-GCM, using a key derived from SESSION_SECRET, into the __Host-sid cookie (HttpOnly, Secure, SameSite=Lax, 14-day max age). PKCE state goes in a 10-minute __Host-oauth cookie. Sign-out revokes the refresh token at https://auth.ravelry.com/oauth2/revoke. Tokens never go in localStorage or any script-readable place (ISC-3)
- OAuth redirect URIs: Ravelry is registered with the production callback and one stable preview alias only; other preview deployments browse without sign-in
- The OAuth redirect URI is configuration, not code: RAVELRY_REDIRECT_URI (server-only env var) is sent as redirect_uri on authorize and token calls; when unset it defaults to <APP_URL>/api/auth/callback, where APP_URL is set per Vercel environment (production default https://niddy.vercel.app). Changing domain means updating the env var and the URI registered at ravelry.com/pro/developer, with no code change
- Visual direction: sleek and modern: neutral zinc surfaces in light, near-black charcoal in dark, terracotta as the one brand accent, photo-forward; derived from ui-ux-pro-max's modern-minimal and Dark Mode (OLED) guidance and approved by the principal (ISC-15)
- Identity: working name "Niddy" (short for niddy-noddy), never Ravelry's name or logo, with a "Powered by the Ravelry API, not affiliated with Ravelry" footer notice. The name is configurable: one value, SITE_NAME in src/config/site.ts (overridable by the NEXT_PUBLIC_SITE_NAME environment variable, which is not a secret), feeds the header, footer, page titles, metadata and web manifest, so a rename needs no code change
- Fallback if read-only basic auth cannot call patterns/search, patterns/show, yarns/search or yarns/show: search and detail pages require Ravelry sign-in, the landing page stays public, and L2.b1 is reworded and restated

## Features

### F0 · Cross-cutting
Why: The work ships correct, safe and inside its boundaries.

- [x] ISC-1: From a clean install (pnpm install --frozen-lockfile), the package scripts build, typecheck (tsc --noEmit) and lint (eslint .) each exit 0, with test (vitest run) and test:e2e (playwright test) scripts defined in package.json
- [x] ISC-2: No secret file is tracked by git: .env* files (except .env.example) are gitignored and git ls-files lists 0 of them (after: ISC-1)
- [ ] ISC-3: Anti: a Ravelry client secret, read-only credential or OAuth token reaches the browser (probe: sentinel values for RAVELRY_CLIENT_SECRET and RAVELRY_READONLY_PASSWORD set at build time appear in 0 files under .next/static; after mocked sign-in 0 token strings appear in localStorage, sessionStorage, document.cookie or browser-bound response bodies; the session cookie is HttpOnly, Secure and SameSite=Lax) (after: ISC-1)
- [ ] ISC-4: Anti: scraping ravelry.com or calling undocumented endpoints (probe: during the smoke run of every route, each server-side outbound request goes to api.ravelry.com on a path whose capability is confirmed in specs/ravelry-api-verification.md, to auth.ravelry.com/oauth2/*, or to an image or delivery host listed in that note; 0 other requests) (after: ISC-1, ISC-16)
- [ ] ISC-5: Anti: branding implies Ravelry endorsement: every page renders a footer notice containing 'not affiliated with Ravelry', and the repo ships 0 Ravelry logo assets (after: ISC-1, ISC-9)
- [x] ISC-6: Anti: monetization or commercial use (probe: src and package.json contain 0 references to ad networks or ad tags: googlesyndication, doubleclick.net, amazon-adsystem, adsbygoogle, adservice.google; affiliate URL parameters are covered by ISC-53) (after: ISC-1)
- [ ] ISC-7: Anti: the site handles payment card data or runs a separate payment processor (probe: on /patterns/<paid fixture id> and /me/library 0 inputs have an autocomplete value starting cc- or a name/id matching card, cvc, cvv or expir; package.json lists 0 payment SDKs: stripe, @stripe/*, braintree*, @paypal/*, square, @adyen/*) (after: ISC-1)
- [ ] ISC-8: Anti: public launch (probe: the responses for /, /patterns, /patterns/<fixture id>, /yarns, /yarns/<fixture id>, /community, /me, /me/library and /design-system each carry an X-Robots-Tag header containing noindex; GET /robots.txt has a line exactly 'Disallow: /') (after: ISC-1)
- [ ] ISC-45: Every UI control for a write or purchase capability (queue, stash, favorites or project write, photo upload, forum post, message send, Buy, checkout) is not rendered when specs/ravelry-api-verification.md marks that capability unconfirmed, with the app's capability config generated from that note (after: ISC-16)
- [ ] ISC-56: The search, filter-sheet, add-to-queue and Buy on Ravelry flows each complete by keyboard alone, with a visible focus indicator (outline or ring of at least 2 CSS px) on every focused control (after: ISC-33, ISC-79)
- [ ] ISC-64: Anti: a local store replaces Ravelry as source of truth (probe: package.json lists 0 database or key-value packages: prisma, @prisma/client, drizzle-orm, typeorm, sequelize, mongoose, mongodb, @upstash/redis, @vercel/kv, ioredis, redis; the only cookies the server sets are __Host-sid, __Host-oauth and __Host-pdf; every cached Ravelry response has a TTL of 300 s or less, except reference lists (yarn weights, pattern categories and attributes, fiber attributes, color families) at 24 h or less) (after: ISC-1)
- [ ] ISC-67: The production Vercel deployment at PROD_URL answers GET / with HTTP 200 and an x-vercel-id response header (after: ISC-1)
- [ ] ISC-68: A pull request's Vercel preview deployment answers GET / with 401 when no protection-bypass header is sent (after: ISC-67)
- [ ] ISC-77: A pull request's Vercel preview deployment answers GET / with 200 when the protection-bypass header is sent (after: ISC-67)
- [ ] ISC-82: A production build with NEXT_PUBLIC_SITE_NAME=Testname shows Testname in all 4 name slots (header; footer; <title> of /, /patterns, /me; web manifest name), with 0 occurrences of the default name there (after: ISC-1)
- [ ] ISC-83: Anti: the site name is hard-coded (probe: the default name appears in 0 files under src other than src/config/site.ts) (after: ISC-82)
- [ ] ISC-70: Every key in .env.example is set in both the Vercel production and preview environments, with 0 secret keys named NEXT_PUBLIC_* (after: ISC-67)

### F1 · DesignSystemFoundation
Why: A documented design system generated with ui-ux-pro-max (tokens, type, color, components, light/dark, a11y rules) makes every page consistent, accessible and noticeably better than ravelry.com.

- [x] ISC-9: design-system/ravelry-companion-site/MASTER.md contains the 5 ui-ux-pro-max generator headings Color Palette, Typography, Spacing Variables, Component Specs and Pre-Delivery Checklist
- [x] ISC-63: The Decisions section records the exact ui-ux-pro-max command (search.py with --design-system --persist -p ravelry-companion-site) that generated MASTER.md, whose first line is the generator header '# Design System Master File' (after: ISC-9)
- [x] ISC-10: Every color token defined for the light theme in src/app/globals.css also has a dark-theme value there (0 tokens missing a dark value) (after: ISC-9, ISC-1)
- [x] ISC-11: design-system/ravelry-companion-site/contrast-pairs.json lists at least 8 foreground/background token pairs, each tagged text or ui, with every text pair at least 4.5:1 and every ui pair at least 3:1 in both light and dark themes (after: ISC-10)
- [x] ISC-12: Anti: regression — a file under src other than src/app/globals.css contains a color literal (hex in a color, fill, stroke or background value, rgb(), hsl(), oklch(), oklab(), arbitrary Tailwind color [#...]) or a default Tailwind palette class such as bg-red-500 (after: ISC-10)
- [ ] ISC-13: At 375x812, every button, input, chip, tab and standalone link (links inline in a sentence of text excluded, per WCAG 2.5.8) on /, /patterns with the filter sheet open, /patterns/<id>, /yarns, /yarns/<id>, /me, /community, /me/library and /design-system has a bounding box of at least 44x44 CSS px (after: ISC-14, ISC-23, ISC-32, ISC-39, ISC-79)
- [x] ISC-14: A /design-system catalog route renders every component listed under Component Specs in MASTER.md, in light and dark themes, with 0 axe-core violations of any impact for tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa (after: ISC-9, ISC-10)
- [x] ISC-15: The ISA Decisions section holds a dated entry 'Design system approved' written by the principal after review of MASTER.md and /design-system (a desktop review is accepted; the phone layout is covered by the mobile e2e projects and screenshots) (after: ISC-14)
- [x] ISC-76: design-system/ravelry-companion-site/pages/workspace.md exists as the ui-ux-pro-max page override for the /me workspace, generated with --page workspace --density 7 --motion 3 (after: ISC-9)

### F2 · RavelryAuthAndApiGateway
Why: A server-only Ravelry API layer with OAuth 2.0 sign-in, token storage/refresh, rate-limit handling, caching and attribution lets public browse and personal features work safely within Ravelry's terms.
Reach: Header → Sign in with Ravelry button; /api/* route handlers (server only)

- [x] ISC-16: specs/ravelry-api-verification.md has one row per capability (patterns-search, patterns-show, pattern-categories, pattern-attributes, yarns-search, yarns-show, current-user, projects-read, projects-write, stash-read, stash-write, queue-read, queue-write, favorites-read, favorites-write, library-read, photos-upload, messages-read, messages-send, forums-read, forums-post, friends-activity, carts, checkout, deliveries, oauth2-scopes, rate-limit), each with status confirmed or unconfirmed, a check date (YYYY-MM-DD) and evidence (a docs URL under https://www.ravelry.com/api or a recorded HTTP status from a live call); 0 rows lack a date or evidence
- [x] ISC-17: GET /api/auth/signin answers with a 302 or 307 redirect to the configured Ravelry authorize URL with a non-empty state; with OAuth 2.1 (the default) that is https://auth.ravelry.com/oauth2/auth with a code_challenge and code_challenge_method=S256, and with OAuth 2.0 (fallback) https://www.ravelry.com/oauth2/auth (after: ISC-16, ISC-1)
- [x] ISC-18: The OAuth callback for a Ravelry username not on the server-side allowlist responds 403 with 0 session cookies set and 0 tokens stored server-side (after: ISC-17)
- [ ] ~~ISC-19: Anti: the Ravelry client secret, read-only API key, or any OAuth access/refresh token appears in a client JS bundle, localStorage, sessionStorage, or a non-httpOnly cookie (after: ISC-17)~~ (retired 2026-11-01: merged into ISC-3)
- [x] ISC-20: A /api/me/* request made with an expired access token and a valid refresh token gets 200 after a server-side token exchange, with 0 redirects to www.ravelry.com (after: ISC-17)
- [x] ISC-21: When Ravelry answers an upstream request with HTTP 429, the site's API route returns 503 with an integer Retry-After header from 1 to 120 (after: ISC-1)
- [ ] ~~ISC-22: Anti: the server sends any data request to a host other than api.ravelry.com (no fetching of ravelry.com HTML pages; OAuth endpoints on www.ravelry.com/oauth2/ are the only exception) (after: ISC-1)~~ (retired 2026-11-01: duplicate of ISC-4, conflicted with photo and delivery hosts)
- [x] ISC-65: After POST /api/auth/signout, a replay of the old session cookie on /api/me/projects gets 401 (probe: the sign-out response clears __Host-sid and calls Ravelry's revocation endpoint once with the session's refresh token) (after: ISC-17)
- [x] ISC-84: With RAVELRY_REDIRECT_URI=https://example.test/cb, the sign-in redirect and the token exchange both send redirect_uri=https://example.test/cb exactly (probe: with it unset, both send <APP_URL>/api/auth/callback) (after: ISC-17)
- [ ] ISC-69: A live Ravelry OAuth sign-in started on PROD_URL returns to PROD_URL/me with HTTP 200 for the principal (after: ISC-17, ISC-67)
- [ ] ISC-71: Every response for /me/* and /api/me/* carries a Cache-Control value containing private or no-store (after: ISC-17)
- [ ] ISC-78: Every public /api/patterns* and /api/yarns* response carries a Cache-Control s-maxage from 1 to 300 (after: ISC-17)
- [x] ISC-72: A client component that imports the Ravelry API client module fails the production build (after: ISC-1)
- [x] ISC-73: specs/architecture.md has one section for each of 9 topics: Design system, API gateway, Sessions, Caching, Vercel runtime, Discovery, Workspace, Community, Purchasing (after: ISC-16)
- [x] ISC-74: The ISA Decisions section holds a dated entry 'Architecture approved' written by the principal after review of specs/architecture.md (after: ISC-73)

### F3 · PatternYarnDiscovery
Why: Photo-forward faceted search with clear pattern and yarn detail pages and yarn substitution/matching is the main reason users would pick this site over ravelry.com.
Reach: / and /patterns → search bar + filter sheet; /patterns/[id]; /yarns and /yarns/[id] → 'Find substitutes' action

- [ ] ISC-23: A visitor who is not signed in who opens /patterns?query=cowl gets HTTP 200 and at least 1 result card that links to /patterns/<id>, with no redirect to a sign-in page (after: ISC-1, ISC-15, ISC-16, ISC-74)
- [ ] ISC-57: A visitor who is not signed in who opens /yarns?query=merino gets HTTP 200 and at least 1 photo result card that links to /yarns/<id>, with no redirect to a sign-in page (after: ISC-23)
- [ ] ISC-24: At a 375px-wide viewport, every pattern result card shows a photo with non-empty alt text (after: ISC-23, ISC-9)
- [ ] ISC-25: Every photo owned by someone other than the signed-in user on /patterns, /patterns/<id>, /yarns and /yarns/<id> shows the owner's Ravelry username as visible credit text next to the photo (after: ISC-24, ISC-57)
- [ ] ~~ISC-26: Each filter chip in the search filter sheet has a touch target of at least 44x44 CSS px at a 375px-wide viewport (after: ISC-23, ISC-9)~~ (retired 2026-11-01: duplicate of ISC-13)
- [ ] ISC-27: A search URL copied after 2 or more filter chips are applied opens in a new browser session with the same active chips and the same first 10 result IDs (after: ISC-23)
- [ ] ISC-28: The pattern detail page /patterns/<id> shows 10 items from the API response: designer, yarn weight, gauge, yardage, sizes, needle or hook size, suggested yarns, difficulty, price or 'Free', plus a link to the pattern on ravelry.com (after: ISC-23)
- [ ] ISC-29: For 3 fixture yarns, every substitute that 'Find substitutes' lists on /yarns/<id> shows a match reason naming its own and the original yarn's weight, fiber content and gauge (probe: at least 1 substitute per fixture yarn, e.g. 'Fingering vs Fingering · 80% merino vs 100% merino · 28 vs 28 sts/4in') (after: ISC-57)
- [ ] ISC-30: At 375x812 with 4x CPU throttling, after a filter chip changes, the updated results render within 500 ms of the API response arriving (p95 over 10 runs) (after: ISC-23, ISC-16)
- [ ] ISC-31: At 375x812 with 4x CPU throttling, a repeat of a filter state already loaded in the session renders its results within 200 ms of the chip change (p95 over 10 runs) with 0 new requests to /api/* (after: ISC-30)
- [ ] ISC-54: On Lighthouse CI's mobile preset (4x CPU throttle, slow 4G), /, /patterns?query=shawl, /patterns/<fixture id> and /yarns/<fixture id> each report LCP <= 2500 ms, CLS <= 0.1 with TBT <= 200 ms as the lab proxy for INP (median of 3 runs) (after: ISC-28, ISC-57)
- [ ] ISC-55: /, /patterns?query=cowl, /patterns/<fixture id>, /yarns and /yarns/<fixture id> each have 0 axe-core violations of any impact for tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa at 375x812 in light and dark themes (after: ISC-28, ISC-29)

### F4 · PersonalWorkspace
Why: Signed-in users can view and edit their projects, queue, stash and favorites and browse their library, with changes saved back to Ravelry, so daily craft tracking works well on a phone.
Reach: /me → tabs for Projects, Queue, Stash, Favorites, Library; 'Add to queue/favorites' on pattern detail

- [ ] ISC-32: For an allowlisted signed-in user, /me shows exactly 5 tabs (Projects, Queue, Stash, Favorites, Library), each labelled with a total equal to the paginator results value of its Ravelry list response (after: ISC-15, ISC-17, ISC-29, ISC-31, ISC-54, ISC-55)
- [ ] ISC-33: On a 390x844 viewport, a signed-in user adds a pattern to their queue from /patterns/<id> in at most 2 taps, with the success state absent before the create-queue response and shown within 500 ms after its 2xx (after: ISC-32, ISC-24)
- [ ] ISC-34: Editing a project's status or progress field on /me/projects/[id] and reloading the page shows the value from Ravelry's response to that write, even when that value differs from what the user typed (after: ISC-32)
- [ ] ISC-58: On a 390x844 viewport, a signed-in user changes a stash item's quantity on /me/stash in at most 2 taps, with the new value absent before Ravelry's stash-update response and shown within 500 ms after its 2xx (after: ISC-32)
- [ ] ISC-35: When a queue, stash, favorites or project write gets 422, 429, 500 or no response within 10 s, the edited field shows its pre-edit value within 1000 ms of the failure, with an error message in an aria-live region (after: ISC-33, ISC-34, ISC-58)
- [ ] ISC-36: Toggling a favorite on /patterns/<id> or a /me/favorites card takes 1 tap, with its aria-pressed value changing only after Ravelry returns 2xx for that write (after: ISC-32)
- [ ] ISC-37: Every /me tab and /me/projects/<id> has 0 axe-core violations of any impact for tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa at 360x780 in light and dark themes (after: ISC-32, ISC-9)
- [ ] ISC-38: Anti: an anonymous or non-allowlisted request to /me or to any workspace write route gets 401 or 403, and no request is sent to Ravelry (after: ISC-17)
- [ ] ISC-61: A live smoke run with the principal's real Ravelry OAuth session completes 1 pattern search, 1 yarn detail load, 1 /me tab load and 1 queue add-then-remove against api.ravelry.com, each returning 2xx, with the queue change visible on ravelry.com (after: ISC-33, ISC-57)
- [ ] ISC-62: On a phone, the principal completes each of 3 timed tasks (find a pattern matching a given craft, yarn weight and free/paid; find substitutes for a given yarn; add a pattern to the queue) in 60 s or less, in less time than the same task on ravelry.com in the same session (after: ISC-15, ISC-29, ISC-33)

### F5 · CommunityHub
Why: Forums, private messages and friend activity in the same mobile-first design let users stay connected without going back to ravelry.com.
Reach: /community → Forums, Messages, Activity tabs

- [ ] ISC-39: An unauthenticated GET to /community or /community/messages returns 307 with a Location that starts with /api/auth/signin, with 0 items from the community fixtures in its body (after: ISC-15, ISC-16, ISC-17, ISC-37, ISC-38, ISC-61)
- [ ] ISC-40: On a 390px-wide viewport, /community/forums shows every topic the mocked Ravelry API returns, each with its title, reply count and last-post time, with no horizontal page scroll (after: ISC-9, ISC-39)
- [ ] ISC-41: A forum reply is absent from the thread before the mocked post endpoint returns, then appears within 500 ms after it returns 2xx (after: ISC-40)
- [ ] ISC-59: For a signed-in user, /community/messages lists every conversation in the mocked Ravelry messages response, each with sender, subject and date, with no horizontal page scroll at 390px (after: ISC-39, ISC-9)
- [ ] ISC-43: A message reply sent from /community/messages/[id] is absent from the conversation before the mocked send endpoint returns, then appears within 500 ms after it returns 2xx (after: ISC-59)
- [ ] ISC-75: The header unread-message badge shows a new mocked message within 120 s, with at most 1 unread-count request per 60 s over a 10-minute fake clock (after: ISC-59)
- [ ] ISC-42: When the forum-post or message-send endpoint returns 4xx or 5xx, the composer keeps the typed text, with a role=alert message stating what failed ('Reply not posted' or 'Message not sent') (after: ISC-41, ISC-43)
- [ ] ISC-60: /community/activity shows every friend-activity item in the mocked Ravelry response, newest first (after: ISC-39, ISC-9)
- [ ] ISC-44: Every photo owned by someone other than the signed-in user on /me/queue, /me/favorites, /me/library and /community/activity shows the owner's Ravelry username as visible credit text next to the photo (after: ISC-60)
- [ ] ISC-46: Each /community page (forums, a topic, messages, a conversation, activity) has 0 axe-core violations of any impact for tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa at 390x844 in light and dark themes (after: ISC-40, ISC-42, ISC-43, ISC-44, ISC-59, ISC-60)

### F6 · PatternPurchasing
Why: Users buy a pattern on ravelry.com in one tap from its page here, then find and open the purchased PDF in their library on this site.
Reach: /patterns/[id] → Buy on Ravelry button; /me/library → download

- [ ] ISC-47: specs/ravelry-api-verification.md records, from the live Ravelry API docs, one of exactly two checkout modes for a third-party OAuth app, 'in-site-api' or 'hosted-handoff' (probe: 1 'checkout_mode:' line, 1 'checkout_checked:' date line, 1 'checkout_source:' URL line under https://www.ravelry.com/api) (after: ISC-16, ISC-46)
- [ ] ~~ISC-48: On a purchasable pattern detail page, a signed-in user who taps Buy sees that pattern listed on /cart within 2 seconds, with the price and currency exactly as the Ravelry cart API response returns them (after: ISC-15, ISC-47, ISC-24, ISC-17)~~ (retired 2026-11-02: Ravelry's cart API serves seller stores only (see specs/ravelry-api-verification.md); replaced by ISC-79)
- [ ] ~~ISC-49: An anonymous visitor who taps Buy on a pattern detail page is sent to Ravelry sign-in and, after sign-in, lands back on the same pattern detail URL (after: ISC-17, ISC-48)~~ (retired 2026-11-02: the hosted hand-off needs no site sign-in; replaced by ISC-79)
- [ ] ~~ISC-50: Checkout from /cart completes the purchase through Ravelry in the checkout_mode recorded in specs/ravelry-api-verification.md: an in-site API call, or a redirect whose host is www.ravelry.com (after: ISC-47, ISC-48)~~ (retired 2026-11-02: checkout_mode is hosted-handoff; merged into ISC-79)
- [ ] ISC-51: After a confirmed purchase, the first load of /me/library lists the pattern with a download action whose route /api/me/library/<id>/download hands the Ravelry-returned delivery only to its buyer (probe: buyer gets 200 with a non-empty body or a 302 to the deliveries-API URL; no session gets 401; another user's session gets 403) (after: ISC-79, ISC-32)
- [ ] ~~ISC-52: Anti: the site collects payment card data — no rendered form field uses an autocomplete value starting with 'cc-' or a name/id matching card, cvv, cvc or expiry, and no payment-processor SDK appears in package.json dependencies (after: ISC-1)~~ (retired 2026-11-01: merged into ISC-7)
- [ ] ~~ISC-53: Anti: the site profits from purchases — cart and checkout pages add no fee, markup, tip or affiliate parameter, so the total shown equals the Ravelry API cart total to the cent (after: ISC-48)~~ (retired 2026-11-02: no in-site cart total exists; replaced by ISC-80)
- [ ] ~~ISC-66: /cart has 0 axe-core violations of any impact for tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa at 375x812 in light and dark themes (after: ISC-48)~~ (retired 2026-11-02: /cart no longer exists; pattern detail and library are covered by ISC-55 and ISC-37)
- [ ] ISC-79: On a paid pattern's /patterns/<id>, the Buy on Ravelry link's href host is www.ravelry.com (after: ISC-28, ISC-47)
- [ ] ISC-81: On a paid pattern's /patterns/<id>, the price and currency next to Buy on Ravelry equal the patterns/show response exactly (after: ISC-79)
- [ ] ISC-80: Anti: the site profits from purchases (probe: every Buy on Ravelry href carries 0 ref=, aff=, affiliate= or utm_ parameters) (after: ISC-79)

## Test Strategy

| isc | type | check | threshold | tool | anchors_to |
|-----|------|-------|-----------|------|------------|
| ISC-1 | bash | production build succeeds from a clean install | exit 0 | `pnpm install --frozen-lockfile && pnpm build` | L2 |
| ISC-1 | bash | typecheck and lint report no errors | exit 0, 0 errors | `pnpm typecheck && pnpm lint` | L2 |
| ISC-1 | bash | the 4 package scripts the Test Strategy calls are defined | jq exits 0 | `jq -e '.scripts \| has("typecheck") and has("lint") and has("test") and has("test:e2e")' package.json` | L2 |
| ISC-2 | bash | .env.local is ignored by git | exit 0 | `git check-ignore -q .env.local` | L2.b4 |
| ISC-2 | bash | no env file other than .env.example is tracked | 0 matching tracked files | `test -z "$(git ls-files \| grep -E '(^\|/)\.env' \| grep -v '\.env\.example$')"` | L2.b4 |
| ISC-3 | bash | sentinel secrets absent from client bundles | 0 matches in .next/static | `RAVELRY_CLIENT_SECRET=sentinel-zz9q RAVELRY_READONLY_PASSWORD=sentinel-yy8q pnpm build && test -d .next/static && ! grep -rqE 'sentinel-(zz9q\|yy8q)' .next/static` | scope |
| ISC-3 | bash | no browser storage writes of tokens or secrets in source | 0 matches | `test -d src/app && ! grep -rniE '(local\|session)Storage\.setItem\([^)]*(token\|secret\|password)' src` | scope |
| ISC-3 | test | e2e after mocked sign-in: browser storage, document.cookie and browser-bound response bodies, plus session cookie attributes | 0 token strings; session cookie HttpOnly=true, Secure=true, SameSite=Lax | `pnpm test:e2e tests/e2e/token-isolation.spec.ts --project=desktop` | scope |
| ISC-4 | test | egress interceptor records every server-side outbound request across a smoke run of all routes, compared with the allowlist and confirmed capabilities in specs/ravelry-api-verification.md | 0 requests outside the allowlist; 0 api.ravelry.com paths outside confirmed capabilities | `pnpm test tests/gateway/egress.test.ts` | scope |
| ISC-4 | bash | no fetch call site targets a ravelry.com web page outside the oauth2 path | 0 matches | `test -d src/lib && ! grep -rnP 'fetch\([^)]*https?://(www\.)?ravelry\.com/(?!oauth2/)' src` | scope |
| ISC-5 | test | e2e visits /, /patterns, /patterns/<fixture id>, /yarns and /me and finds the notice | 5 of 5 pages contain the text | `pnpm test:e2e tests/e2e/attribution-notice.spec.ts --project=mobile-375` | scope |
| ISC-5 | bash | no Ravelry logo files in public assets | 0 files | `test -d public && test -z "$(find public \( -iname '*ravelry*logo*' -o -iname '*ravelry*.svg' \))"` | scope |
| ISC-6 | bash | no ad-network host or ad tag in source or package.json | 0 matches | `test -d src && ! grep -rniE 'googlesyndication\|doubleclick\.net\|amazon-adsystem\|adsbygoogle\|adservice\.google' src package.json` | scope |
| ISC-7 | test | e2e on the paid pattern page and /me/library counts card inputs in the DOM | 0 inputs with autocomplete^=cc- or name/id matching /card\|cvc\|cvv\|expir/i | `pnpm test:e2e tests/e2e/no-card-fields.spec.ts --project=mobile-375` | scope |
| ISC-7 | bash | no payment-processor SDK in dependencies | 0 matching dependency names | `test -f package.json && ! jq -r '(.dependencies // {}) + (.devDependencies // {}) \| keys[]' package.json \| grep -Eix 'stripe\|@stripe/.*\|braintree.*\|@paypal/.*\|square\|@adyen/.*'` | scope |
| ISC-8 | test | e2e requests 9 routes and /robots.txt | 9 of 9 responses carry X-Robots-Tag containing noindex; robots.txt has a line exactly 'Disallow: /' | `pnpm test:e2e tests/e2e/noindex.spec.ts --project=desktop` | scope |
| ISC-45 | test | unit test loads the real specs/ravelry-api-verification.md through the app's capability parser, marks each write capability unconfirmed in turn, and renders each write control | 0 rendered controls for unconfirmed capabilities; 100% rendered for confirmed ones | `pnpm test tests/unit/capabilities.test.ts` | L2.b4 |
| ISC-45 | bash | generated capability config matches the verification note | exit 0 | `node scripts/check-capabilities-sync.mjs` | L2.b4 |
| ISC-56 | test | keyboard-only Playwright run of 4 flows | 4 of 4 flows complete; computed outline or ring width >= 2px on each focused element | `pnpm test:e2e tests/e2e/a11y/keyboard-flows.spec.ts --project=desktop` | L2.b4 |
| ISC-64 | bash | no database or key-value package in dependencies | 0 matching dependency names | `test -f package.json && ! jq -r '(.dependencies // {}) + (.devDependencies // {}) \| keys[]' package.json \| grep -Eix 'prisma\|@prisma/client\|drizzle-orm\|typeorm\|sequelize\|mongoose\|mongodb\|@upstash/redis\|@vercel/kv\|ioredis\|redis'` | scope |
| ISC-64 | test | gateway smoke run records every Set-Cookie name and every Cache-Control max age | cookie names ⊆ {__Host-sid, __Host-oauth, __Host-pdf}; s-maxage <= 300 except /api/ref/* <= 86400 | `pnpm test tests/gateway/no-shadow-store.test.ts` | scope |
| ISC-67 | curl | production deployment serves the home page from Vercel | 200 + x-vercel-id header | `curl -sfI "$PROD_URL" \| grep -qi '^x-vercel-id:'` | L2 |
| ISC-68 | curl | preview deployment rejects requests without the bypass header | 401 | `test "$(curl -so /dev/null -w '%{http_code}' "$PREVIEW_URL")" = 401` | L2.b4 |
| ISC-77 | curl | preview deployment serves the home page with the bypass header | 200 | `test "$(curl -so /dev/null -w '%{http_code}' -H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET" "$PREVIEW_URL")" = 200` | L2 |
| ISC-82 | test | e2e against a build with NEXT_PUBLIC_SITE_NAME=Testname | header, footer, 3 page titles and manifest name contain Testname; 0 contain the default name | `NEXT_PUBLIC_SITE_NAME=Testname pnpm test:e2e tests/e2e/site-name.spec.ts --project=desktop` | L2.b4 |
| ISC-83 | bash | grep for the default name outside the config file | 0 matches | `test -f src/config/site.ts && ! grep -rli 'niddy' src --exclude=site.ts` | scope |
| ISC-70 | bash | every .env.example key is set in Vercel production and preview | 0 missing keys in 2 environments | `node scripts/check-vercel-env.mjs` | L2.b4 |
| ISC-70 | bash | no secret key uses a NEXT_PUBLIC_ name | 0 matches | `test -f .env.example && ! grep -rnE 'NEXT_PUBLIC_[A-Z0-9_]*(RAVELRY\|SECRET\|TOKEN\|PASSWORD\|KV)' .env.example src` | scope |
| ISC-9 | bash | MASTER.md exists and has all 5 generator headings | file exists + 5 of 5 headings found | `f=design-system/ravelry-companion-site/MASTER.md; test -f $f && for h in 'Color Palette' Typography 'Spacing Variables' 'Component Specs' 'Pre-Delivery Checklist'; do grep -qE "^#+ $h" $f \|\| exit 1; done` | L2 |
| ISC-63 | bash | Decisions holds the generator command; MASTER.md starts with the generator header | 1 or more dated Decisions lines with the command; first line matches exactly | `grep -qE '^- 20[0-9]{2}-[0-9]{2}-[0-9]{2} · .*search\.py .*--design-system .*--persist' specs/isa/ravelry-site.isa.md && head -1 design-system/ravelry-companion-site/MASTER.md \| grep -qx '# Design System Master File'` | L2 |
| ISC-10 | test | unit test parses theme tokens in src/app/globals.css and compares the light and dark token sets | 0 light tokens without a dark counterpart | `pnpm test tests/unit/design-tokens.themes.test.ts` | L2 |
| ISC-11 | test | unit test parses contrast-pairs.json and computes contrast ratios in light and dark | >= 8 pairs parsed; 0 pairs below their bar (text 4.5:1, ui 3:1) in 2 themes | `pnpm test tests/unit/design-tokens.contrast.test.ts` | L2.b4 |
| ISC-12 | bash | grep for color literals and default palette classes under src, excluding globals.css | 0 matches | `test -d src && ! grep -rnE --include='*.ts' --include='*.tsx' --include='*.css' --exclude=globals.css '(color\|fill\|stroke\|background)[^;,}]{0,4}#[0-9a-fA-F]{3,8}\b\|rgba?\(\|hsla?\(\|okl(ch\|ab)\(\|-\[#\|\b(bg\|text\|border\|ring\|fill\|stroke\|from\|via\|to\|outline\|divide\|shadow)-(red\|orange\|amber\|yellow\|lime\|green\|emerald\|teal\|cyan\|sky\|blue\|indigo\|violet\|purple\|fuchsia\|pink\|rose\|slate\|gray\|zinc\|neutral\|stone)-[0-9]{2,3}\b' src` | L2 |
| ISC-13 | test | Playwright measures bounding boxes of buttons, inputs, chips, tabs and standalone links on 9 routes plus the open filter sheet at 375x812 | 0 qualifying controls smaller than 44x44 px | `pnpm test:e2e tests/e2e/a11y/touch-targets.spec.ts --project=mobile-375` | L2.b4 |
| ISC-14 | test | e2e reads component names from the Component Specs section of MASTER.md and asserts each has a rendered example on /design-system | 100% of listed components rendered | `pnpm test:e2e tests/e2e/design-system-catalog.spec.ts --project=mobile-375` | L2 |
| ISC-14 | test | axe-core scan of /design-system in light and dark at 375px | 0 violations of any impact for tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa | `pnpm test:e2e tests/e2e/a11y/design-system.spec.ts --project=mobile-375` | L2.b4 |
| ISC-15 | bash | dated approval entry in Decisions | 1 or more matching lines | `grep -qE '^- 20[0-9]{2}-[0-9]{2}-[0-9]{2} · Design system approved' specs/isa/ravelry-site.isa.md` | L3 |
| ISC-76 | bash | workspace page override exists and is non-empty | file exists, size > 0 | `test -s design-system/ravelry-companion-site/pages/workspace.md` | L2.b2 |
| ISC-16 | bash | verification note has one valid row per capability | 27 of 27 rows; 0 rows with an invalid status, a missing date or missing evidence | `node scripts/check-api-verification.mjs specs/ravelry-api-verification.md` | L2.b4 |
| ISC-17 | test | e2e request to the sign-in route without following redirects | status 302 or 307; Location starts with https://auth.ravelry.com/oauth2/auth with non-empty state= and code_challenge=, and code_challenge_method=S256 | `pnpm test:e2e tests/e2e/auth/signin-redirect.spec.ts --project=desktop` | L2.b2 |
| ISC-18 | test | OAuth callback with a mocked non-allowlisted username | callback status 403; 0 Set-Cookie headers naming the session cookie; 0 token records stored | `pnpm test tests/gateway/allowlist.test.ts` | L2.b2 |
| ISC-20 | test | mocked Ravelry returns 401 for the expired token; refresh endpoint returns a new token | 200 response; 0 3xx responses to www.ravelry.com | `pnpm test tests/gateway/token-refresh.test.ts` | L2.b2 |
| ISC-21 | test | mocked upstream 429 on a public pattern search route | 503 status; Retry-After integer in [1,120] | `pnpm test tests/gateway/rate-limit.test.ts` | L2.b4 |
| ISC-84 | test | gateway test with a mocked token endpoint, run with the env var set and unset | redirect_uri equals the env value (set) or APP_URL + /api/auth/callback (unset) on 2 of 2 calls in both runs | `pnpm test tests/gateway/redirect-uri.test.ts` | L2.b2 |
| ISC-65 | test | sign in (mocked Ravelry), sign out, replay the old cookie | sign-out clears __Host-sid; 1 call to the mocked revocation endpoint with the refresh token; replay status 401 | `pnpm test tests/gateway/signout.test.ts` | L2.b2 |
| ISC-69 | test | tagged live OAuth round trip against the production domain | final URL equals PROD_URL/me; status 200 | `RAVELRY_LIVE=1 BASE_URL="$PROD_URL" pnpm test:e2e --grep @live-oauth --project=desktop` | L2.b2 |
| ISC-71 | test | route-handler tests read Cache-Control on every signed-in route | 100% of /me and /api/me responses private or no-store | `pnpm test tests/gateway/cache-headers.test.ts -t signed-in` | L2.b4 |
| ISC-78 | test | route-handler tests read Cache-Control on every public read route | 100% of public read routes s-maxage in [1,300] | `pnpm test tests/gateway/cache-headers.test.ts -t public` | L2.b4 |
| ISC-72 | test | build a fixture client component that imports the Ravelry client module | build exits non-zero with a server-only import error | `pnpm test tests/unit/server-only-guard.test.ts` | L2.b4 |
| ISC-73 | bash | architecture doc has all 9 topic headings | 9 of 9 headings found | `f=specs/architecture.md; test -f $f && for h in 'Design system' 'API gateway' Sessions Caching 'Vercel runtime' Discovery Workspace Community Purchasing; do grep -qE "^#+ $h" $f \|\| exit 1; done` | L2 |
| ISC-74 | bash | dated architecture approval entry in Decisions | 1 or more matching lines | `grep -qE '^- 20[0-9]{2}-[0-9]{2}-[0-9]{2} · Architecture approved' specs/isa/ravelry-site.isa.md` | L2 |
| ISC-23 | test | anonymous pattern search renders result cards against the recorded API fixture | status 200, >=1 card with href matching /patterns/<digits>, final URL has no /sign-in | `pnpm test:e2e tests/e2e/discovery/anonymous-search.spec.ts --project=mobile-375` | L2.b1 |
| ISC-57 | test | anonymous yarn search against the recorded fixture | status 200, >=1 card with an img and href matching /yarns/<digits>, final URL has no sign-in | `pnpm test:e2e tests/e2e/discovery/anonymous-yarn-search.spec.ts --project=mobile-375` | L2.b1 |
| ISC-24 | test | each result card at 375x812 has a visible img with a non-empty alt attribute | 100% of cards have a visible img with alt length >= 1 | `pnpm test:e2e tests/e2e/discovery/photo-grid.spec.ts --project=mobile-375` | L2.b1 |
| ISC-25 | test | each rendered photo on the 4 discovery routes has an adjacent credit element whose text equals the fixture photo owner username | 0 photos without matching owner credit | `pnpm test:e2e tests/e2e/discovery/photo-credit.spec.ts --project=mobile-375` | L2.b1 |
| ISC-27 | test | against the recorded API fixture: apply craft + weight chips, copy URL, open in a fresh browser context, compare chips and result IDs | identical active chip set; identical first 10 pattern IDs | `pnpm test:e2e tests/e2e/discovery/shareable-filters.spec.ts --project=mobile-375` | L2.b1 |
| ISC-28 | test | detail page items rendered from the recorded API fixture for 3 sample patterns (one free, one paid, one crochet) | all 10 items present and equal to fixture values for 3/3 patterns | `pnpm test:e2e tests/e2e/discovery/pattern-detail.spec.ts --project=mobile-375` | L2.b1 |
| ISC-29 | test | substitutes list for 3 fixture yarns; each item's reason names both yarns' weight, fiber and gauge | >=1 substitute per yarn; 100% of reasons contain both weight names, both fiber terms and both gauge values | `pnpm test:e2e tests/e2e/discovery/yarn-substitutes.spec.ts --project=mobile-375` | L2.b1 |
| ISC-30 | test | time from mocked API response to results render at 4x CPU throttle | p95 <= 500 ms over 10 runs | `pnpm test:e2e tests/e2e/discovery/search-latency.spec.ts --project=mobile-375` | L2.b4 |
| ISC-31 | test | time from repeated filter change to results render, cached path, at 4x CPU throttle | p95 <= 200 ms over 10 runs; 0 new /api/* requests | `pnpm test:e2e tests/e2e/discovery/search-latency-cached.spec.ts --project=mobile-375` | L2.b4 |
| ISC-54 | test | Lighthouse CI mobile preset on 4 routes against recorded fixtures, 3 runs each | LCP <= 2500 ms, CLS <= 0.1, TBT <= 200 ms (median) on 4 of 4 routes | `pnpm exec lhci autorun --config=lighthouserc.json` | L2.b4 |
| ISC-55 | test | axe scan of 5 discovery routes x 2 themes | 0 violations on 10 of 10 scans | `pnpm test:e2e tests/e2e/a11y/discovery.spec.ts --project=mobile-375` | L2.b4 |
| ISC-32 | test | /me tabs and totals against the recorded Ravelry fixture | 5 tabs present; 5 of 5 tab totals equal paginator.results; first page of cards in fixture order | `pnpm test:e2e tests/e2e/workspace/tabs.spec.ts --project=mobile-390` | L2.b2 |
| ISC-33 | test | tap count from pattern detail to confirmed queue entry, with the mocked create-queue write delayed 1 s | <= 2 taps; 0 success states before the 2xx; success shown within 500 ms after it | `pnpm test:e2e tests/e2e/workspace/add-to-queue.spec.ts --project=mobile-390` | L2.b2 |
| ISC-34 | test | mocked Ravelry update returns a normalized value different from the submitted one | after save and after reload, UI shows the Ravelry-returned value, not the submitted value | `pnpm test:e2e tests/e2e/workspace/project-edit.spec.ts --project=mobile-390` | L2.b2 |
| ISC-58 | test | tap count and confirm-after-2xx for a stash quantity edit, with the mocked write delayed 1 s | <= 2 taps; 0 updated values before the 2xx; new value within 500 ms after it | `pnpm test:e2e tests/e2e/workspace/stash-edit.spec.ts --project=mobile-390` | L2.b2 |
| ISC-35 | test | mocked 422, 429, 500 and 10 s timeout on each of the 4 write types | 16/16 cases: pre-edit value restored <= 1000 ms after the failure; error text in an [aria-live] region; 0 success toasts | `pnpm test:e2e tests/e2e/workspace/write-failure.spec.ts --project=mobile-390` | L2.b2 |
| ISC-36 | test | favorite toggle tap count and aria-pressed value before and after the mocked Ravelry response | 1 tap; aria-pressed unchanged before the 2xx; flipped after it (both directions) | `pnpm test:e2e tests/e2e/workspace/favorite-toggle.spec.ts --project=mobile-390` | L2.b2 |
| ISC-37 | test | axe-core scan of the 5 /me tabs and /me/projects/<id> at 360x780 in 2 themes | 0 violations of any impact on 12 of 12 scans | `pnpm test:e2e tests/e2e/a11y/workspace.spec.ts --project=mobile-360` | L2.b4 |
| ISC-38 | test | route-handler tests for anonymous and non-allowlisted sessions on all workspace read/write routes, with a Ravelry HTTP mock asserting zero outbound calls | status in {401,403} for 100% of routes; 0 outbound Ravelry requests | `pnpm test tests/unit/workspace-auth.test.ts` | scope |
| ISC-61 | test | tagged live suite against api.ravelry.com with the principal's session | 4 of 4 steps return 2xx | `RAVELRY_LIVE=1 pnpm test:e2e --grep @live --project=mobile-390` | L2.b2 |
| ISC-61 | manual | principal checks the queue change on ravelry.com during the live run | change visible after the add, gone after the remove | Principal opens their ravelry.com queue during and after the live run; logs the result in ## Verification | L2.b2 |
| ISC-62 | manual | timed side-by-side tasks on a phone: this site against ravelry.com | site time <= 60 s per task and below the ravelry.com time on 3 of 3 tasks; times logged in ## Verification | Principal runs the 3 tasks on both sites with a stopwatch | L3 |
| ISC-39 | test | anonymous request to /community and /community/messages without following redirects | status 307; Location starts with /api/auth/signin; 0 community fixture items in body | `pnpm test:e2e tests/e2e/community/auth-gate.spec.ts --project=desktop` | L2.b3 |
| ISC-40 | test | rendered topic rows match the mocked forum topics fixture at 390x844 | rows rendered = fixture topic count (>=1); scrollWidth <= 390 | `pnpm test:e2e tests/e2e/community/forums.spec.ts --grep topic-list --project=mobile-390` | L2.b3 |
| ISC-41 | test | with the mocked post endpoint delayed 1 s, check the thread before and after the response | 0 posted reply nodes before the response; 1 within 500 ms after the 2xx | `pnpm test:e2e tests/e2e/community/forums.spec.ts --grep reply-confirmed --project=mobile-390` | L2.b3 |
| ISC-59 | test | rendered conversation rows match the fixture | rows = fixture count (>=1), each with sender, subject and date; scrollWidth <= 390 | `pnpm test:e2e tests/e2e/community/messages.spec.ts --grep inbox-list --project=mobile-390` | L2.b3 |
| ISC-43 | test | with the mocked message-send endpoint delayed 1 s, check the conversation before and after the response | 0 sent-message nodes before the response; 1 within 500 ms after the 2xx | `pnpm test:e2e tests/e2e/community/messages.spec.ts --grep send-confirmed --project=mobile-390` | L2.b3 |
| ISC-75 | test | fake clock over 10 minutes; a new message is added to the mocked unread count | badge updates within 120 s; <= 1 unread-count request per 60 s | `pnpm test:e2e tests/e2e/community/unread-badge.spec.ts --project=mobile-390` | L2.b3 |
| ISC-42 | test | mocked forum-post and message-send endpoints return 4xx and 5xx | 4/4 cases (2 endpoints x 4xx, 5xx): composer text unchanged; role=alert text contains 'Reply not posted' or 'Message not sent' | `pnpm test:e2e tests/e2e/community/compose-errors.spec.ts --project=mobile-390` | L2.b3 |
| ISC-60 | test | rendered activity items match the fixture, in order | items = fixture count (>=1); order by date descending | `pnpm test:e2e tests/e2e/community/activity.spec.ts --grep feed --project=mobile-390` | L2.b3 |
| ISC-44 | test | for each photo on the 4 routes in the mocked fixtures, a credit element contains the owner username | 0 photos owned by others without owner credit | `pnpm test:e2e tests/e2e/photo-credit-signed-in.spec.ts --project=mobile-390` | L2.b4 |
| ISC-46 | test | axe-core scan on 5 community routes x 2 themes at 390x844 | 0 violations of any impact on 10 of 10 scans | `pnpm test:e2e tests/e2e/a11y/community.spec.ts --project=mobile-390` | L2.b4 |
| ISC-47 | bash | verification note names one checkout mode, a check date and a source URL | 1 mode line, 1 date line, 1 source URL line | `f=specs/ravelry-api-verification.md; test $(grep -cE '^checkout_mode: (in-site-api\|hosted-handoff)$' $f) -eq 1 && test $(grep -cE '^checkout_checked: 20[0-9]{2}-[0-9]{2}-[0-9]{2}$' $f) -eq 1 && test $(grep -cE '^checkout_source: https://www\.ravelry\.com/api' $f) -eq 1` | L2.b4 |
| ISC-79 | test | e2e on paid and free fixture patterns reads the Buy on Ravelry link | paid: href host www.ravelry.com; free: no Buy link | `pnpm test:e2e tests/e2e/purchasing/buy-handoff.spec.ts --project=mobile-390` | L2.b3 |
| ISC-81 | test | price and currency text next to Buy on Ravelry for 2 paid fixture patterns | equal to the patterns/show fixture on 2 of 2 | `pnpm test:e2e tests/e2e/purchasing/buy-handoff.spec.ts --grep price --project=mobile-390` | L2.b3 |
| ISC-80 | test | collect every Buy on Ravelry href on the paid fixture pages | 0 hrefs with ref=, aff=, affiliate= or utm_ | `pnpm test:e2e tests/e2e/purchasing/no-affiliate.spec.ts --project=mobile-390` | scope |
| ISC-51 | manual | one real paid purchase at the lowest available price by the principal, via Buy on Ravelry | purchased pattern listed on the next /me/library load, PDF opens | Principal buys one paid pattern through the hand-off, then opens /me/library; logs the result in ## Verification | L2.b3 |
| ISC-51 | test | e2e: purchased pattern shows in library with a working download for the buyer | pattern listed on first /me/library load; download returns 200 with non-zero body or a 302 to the deliveries-API URL | `pnpm test:e2e tests/e2e/purchasing/library-download.spec.ts --project=mobile-390` | L2.b3 |
| ISC-51 | test | download route denies non-owners | status 401 for no session, 403 for another user's session | `pnpm test tests/unit/deliveries-route.test.ts` | L2.b4 |

## Open Questions

- [x] Q1 (re-answered 2026-11-02 from the docs: carts/* serve seller stores only, so checkout_mode is hosted-handoff): Does the Ravelry cart/checkout API actually allow a third-party OAuth app to complete purchases, or does checkout have to hand off to ravelry.com? — recommended: Verify against the live docs first; if direct checkout is not allowed, build the cart in-site and hand off to Ravelry's hosted checkout, and keep deliveries/downloads in-site. → answered: accepted recommended (2026-11-02): the ISC-16 spike settles it; ISC-47 records checkout_mode, and ISC-50 supports both modes
- [x] Q2: Which API facts in the brief (endpoint names, OAuth 2.0 scopes, rate limits, photo upload, messages/forums write access) are confirmed? — recommended: Make a spike that verifies each endpoint family with a logged-in developer account before build criteria depend on it; keep unconfirmed capabilities as conditional criteria. → answered: accepted recommended (2026-11-02): ISC-16 verification spike before any build criterion depends on an endpoint; unconfirmed capabilities retire their criteria (Decision 2026-11-01)
- [x] Q3: How are beta users gated: any Ravelry account can sign in, or only an allowlist of usernames? — recommended: Server-side allowlist of Ravelry usernames for signed-in features; public browse stays open but unlisted (noindex). → answered: accepted recommended (2026-11-02): server-side allowlist of Ravelry usernames (ISC-18); public browse open but noindex (ISC-8)
- [x] Q4: Where are sessions/tokens stored on Vercel (hosting is settled: Vercel)? — recommended: Encrypted httpOnly session cookie holding a session id, with tokens in a Redis key-value store from the Vercel Marketplace (e.g. Upstash Redis), not an ORM-backed entity database (per ISC-64); serverless functions have no persistent disk, so a file store is not an option. Settle in specs/architecture.md (ISC-73) before ISC-20 and ISC-65 enter the frontier. → answered: accepted recommended (2026-11-02): encrypted httpOnly session-id cookie, tokens in Upstash Redis via the Vercel Marketplace (Constraints); re-answered 2026-11-05: no server-side store, sessions in an encrypted HttpOnly cookie (principal chose it over Redis to avoid setting up a database)
- [x] Q5: What are the concrete performance budgets for 'fast'? — recommended: Core Web Vitals 'good' on mid-range mobile: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1; search results update within 500ms after the API responds (cached repeat < 200ms). → answered: accepted recommended (2026-11-02): already encoded in ISC-30, ISC-31 and ISC-54
- [x] Q6: What visual direction should ui-ux-pro-max target (warm/crafty, minimal editorial, etc.) and is dark mode required? — recommended: Let ui-ux-pro-max propose a warm, photo-forward craft palette with light and dark themes; principal approves the generated design system before pages are built. → answered: accepted recommended (2026-11-02): ui-ux-pro-max proposes a warm, photo-forward craft palette with light and dark themes; principal approves via ISC-15
- [x] Q7: Does the project need a site name and brand distinct from Ravelry? — recommended: Use a neutral working name with a 'Powered by the Ravelry API, not affiliated with Ravelry' notice in the footer. → answered: accepted recommended (2026-11-02): neutral working name, footer notice "Powered by the Ravelry API, not affiliated with Ravelry" (ISC-5)
- [x] Q8 (settled 2026-11-02: all four in v1, including purchasing and messaging, built in dependency order after an approved architecture): Should v1 deliver all four areas at once, or in phased order inside v1? — recommended: Keep all four in v1 as the principal stated, but sequence build order: design system and API gateway, then discovery, workspace, community, purchasing. The ISA is above the 40-criterion soft limit; the alternative is to ship F5 CommunityHub and F6 PatternPurchasing as later extend passes of this ISA.
- [x] Q9: Is the private beta permitted under Ravelry's API terms without prior permission, and does the app registration need special access (for example for purchasing)? — recommended: Register as a non-commercial personal app and read the current terms during the verification spike; contact Ravelry if purchasing or multi-user access needs approval. → answered: accepted recommended (2026-11-02): register as a non-commercial personal app; read current terms during the ISC-16 spike; contact Ravelry if purchasing or multi-user access needs approval
- [x] Q10: Ravelry OAuth needs registered redirect URIs, but each Vercel preview has a different URL. How do previews sign in? — recommended: Register the production callback plus one stable preview alias (a fixed branch domain such as preview.<domain>); run live OAuth checks only against those two, and let other previews browse without sign-in. → answered: accepted recommended (2026-11-02): register the production callback plus one stable preview alias; live OAuth checks run only on those two (Constraints)
- [x] Q11: Which production domain is registered as the Ravelry OAuth redirect? — recommended: niddy.vercel.app (free on 2026-11-02), with the stable preview alias on the vercel.app URL of a fixed preview branch; move to a custom domain (niddy.app is available) only after the trademark check. → answered (2026-11-03): niddy.vercel.app, with the redirect URI configurable through RAVELRY_REDIRECT_URI / APP_URL (ISC-84)
- [ ] Q12: Is "Niddy" clear of trademarks? — recommended: principal runs a search at tmsearch.uspto.gov in classes 9 and 42 before any public launch; domains checked 2026-11-02 (niddy.app available, niddy.com parked for sale, niddy.vercel.app free; Purlwise, Yarn Over and Skein & Co rejected for live conflicts).
- [x] Q13 (settled 2026-11-02): How do we close the remaining API gaps? → answered: the principal pastes the rest of the docs, and a live probe with the read-only key (kept in .env.local) records real hosts and status codes.
- [x] Q14 (settled 2026-11-02): What if read-only auth cannot reach pattern and yarn search? → answered: search and detail need sign-in, the landing page stays public (Constraints).

## Decisions

- 2026-11-01 · Unconfirmed capabilities retire their criteria — because L1 forbids workarounds: when the ISC-16 spike marks a capability unconfirmed, ISC-45 keeps its controls hidden and each criterion that needs it is struck through with the reason, instead of being built (affects: ISC-33, ISC-34, ISC-35, ISC-36, ISC-58, ISC-41, ISC-42, ISC-43, ISC-59, ISC-60, ISC-47, ISC-48, ISC-49, ISC-50, ISC-51)
- 2026-11-01 · One verification record — because the egress allowlist, capability gating and checkout mode must read the same facts: specs/ravelry-api-verification.md holds the capability rows, the allowed image and delivery hosts and the checkout_mode lines (affects: ISC-4, ISC-16, ISC-45, ISC-47, ISC-50)
- 2026-11-01 · Build order is encoded as dependencies — because L1 says each area is complete before the next starts: the first criterion of F3, F4, F5 and F6 depends on design-system approval (ISC-15) and on the last criteria of the area before it (affects: ISC-23, ISC-32, ISC-39, ISC-47, ISC-48)
- 2026-11-02 · Host on Vercel — because the principal said so: production from main, protected previews per pull request, secrets in Vercel environment variables, no edge caching of signed-in responses (affects: ISC-67, ISC-68, ISC-69, ISC-70, ISC-71, ISC-77, ISC-78)
- 2026-11-02 · Purchasing and messaging stay in v1 — because the principal chose to keep them, overriding the critique's suggestion to defer F5 and F6; the scope-heavy soft warning is accepted for this reason (affects: F5, F6, Q8)
- 2026-11-02 · Architecture first — because the principal wants the architecture right for everything: specs/architecture.md covers all four areas and needs principal approval before the first feature criterion (ISC-23 now also depends on ISC-74) (affects: ISC-23, ISC-72, ISC-73, ISC-74, ISC-75)
- 2026-11-02 · ui-ux-pro-max dials — because the principal took the recommendation: MASTER design system with density 5 and motion 3 (variance left at the default); workspace page override with density 7 and motion 3. If the generator ignores the dials for a page override, set workspace spacing in pages/workspace.md by hand and log it under Learning (affects: ISC-9, ISC-63, ISC-76)
- 2026-11-02 · OAuth 2.1 with PKCE at auth.ravelry.com — because the docs recommend it for new apps and it gives refresh tokens via offline_access (affects: ISC-4, ISC-17, ISC-20)
- 2026-11-02 · Purchasing is a hand-off to ravelry.com — because the docs show carts/* and external_checkout serve seller stores with a Ravelry-issued store_id, not buyers; in-site cart criteria are retired, the library and PDF download stay (affects: ISC-47, ISC-48, ISC-49, ISC-50, ISC-51, ISC-53, ISC-66, ISC-79, ISC-80, ISC-81)
- 2026-11-02 · Working name Niddy, configurable — because Purlwise is taken by a live knitting app, and the principal wants to rename later without code changes (affects: ISC-5, ISC-82, ISC-83)
- 2026-11-03 · Production domain niddy.vercel.app, redirect URI configurable — because the principal accepted Q11 and wants a later domain change to need no code change (affects: ISC-17, ISC-69, ISC-84)
- 2026-11-04 · Design system generated with ui-ux-pro-max 2.15.0: `search.py "recipe cooking app warm photo cards" --design-system --persist -p ravelry-companion-site --variance 3 --density 5 --motion 3 --output-dir <project root>`, then `--page workspace --density 7` for the override — because the craft-community query returned a purple/green palette, a marketing landing pattern and a hard-to-read display font; the recipe-app framing gives a warm terracotta palette with Varela Round and Nunito Sans (affects: ISC-9, ISC-63, ISC-76)
- 2026-11-04 · Variance set to 3 instead of the default — because with no variance the generator picked Claymorphism (chunky borders that compete with photos, dark mode only "conditional"); variance 3 keeps the same palette and fonts and selects Minimalism & Swiss Style with full light and dark support (affects: ISC-9, ISC-10)
- 2026-11-04 · Dark theme and --color-input are hand-derived in MASTER.md "Project Additions" — because the generator has no warm dark palette; every text pair is at least 4.83:1 and every UI pair at least 3.6:1 in both themes (design-system/ravelry-companion-site/contrast-pairs.json) (affects: ISC-10, ISC-11)
- 2026-11-04 · Workspace uses the generator's Dense-tier spacing (density 8 table) — because the principal wanted a tighter workspace, and density 7 falls in the same Standard tier as Master; 44x44 targets are kept (affects: ISC-13, ISC-76)
- 2026-11-05 · Checks against routes that do not exist yet are pending, not passing — because a header or footer check against a 404 proves nothing: tests/e2e/routes.ts registers them as test.fixme until the feature route ships; their criteria stay unchecked although the mechanism is built (affects: ISC-3, ISC-5, ISC-7, ISC-8, ISC-64, ISC-82, ISC-83)
- 2026-11-05 · Both themes reworked to a sleek modern neutral palette — because the principal asked for a "sleek modern dark" and then the same for light; light uses the generator's modern-minimal neutrals (zinc scale, white cards, hairline borders) and dark uses near-black charcoal with lighter surface steps for depth; terracotta stays the brand accent, and every pair still passes (text ≥ 4.83:1, UI ≥ 3.28:1) (affects: ISC-10, ISC-11, ISC-14, ISC-15)
- 2026-11-05 · Plus Jakarta Sans for headings and body, replacing Varela Round + Nunito Sans — because the principal chose it for the sleek modern look; it is the generator's pick for "sleek minimal productivity tool"; headings 600 weight, letter-spacing -0.015em, word-spacing 0.08em (affects: ISC-14, ISC-15)
- 2026-11-05 · Design system approved — by the principal ("approved, draft the architecture doc") after reviewing /design-system with the modern neutral/charcoal palettes and Plus Jakarta Sans; the review device was not stated (affects: ISC-15, ISC-23, ISC-32, ISC-39, ISC-48)
- 2026-11-05 · Architecture approved — by the principal, with all six decisions: D1 Upstash Redis, D2 TanStack Query, D3 24 h reference-list cache, D4 zod at the gateway, D5 AES-256-GCM-encrypted tokens with only a session id in the cookie, D6 a separate on-demand library-pdf token; the [verify] items in specs/architecture.md close with ISC-16 (affects: ISC-73, ISC-74, ISC-23)
- 2026-11-05 · ISC-64 amended: reference lists may be cached up to 24 h — because Ravelry's docs recommend caching attribute and category lists for up to 24 hours, and the principal chose to follow them; all other cached responses stay at 300 s or less (affects: ISC-64)
- 2026-11-05 · ISC-15 amended: a desktop review is accepted — because the principal reviewed /design-system on desktop and judged the mobile e2e projects (360, 375, 390 px) plus phone screenshots enough for the phone layout (affects: ISC-15)
- 2026-11-05 · D1 and D5 revised: sessions live in an encrypted HttpOnly cookie, with no Redis — because the principal asked for something like localStorage to avoid setting up a database; tokens cannot go in localStorage (ISC-3), so they are sealed with AES-256-GCM in __Host-sid instead; sign-out revokes the refresh token at auth.ravelry.com/oauth2/revoke (found in Ravelry's discovery document); caching moves to Vercel's CDN, and the unread throttle to localStorage; ISC-64 and ISC-65 reworded to match (affects: ISC-3, ISC-18, ISC-20, ISC-64, ISC-65, ISC-75)
- 2026-11-12 · OAuth 2.0 fallback added (RAVELRY_OAUTH_VERSION=2.0) — because the principal asked to "just go to 2.0" while Ravelry's 2.1 login page returns 500; 2.0 uses www.ravelry.com, the 'offline' scope and no PKCE; 2.1 stays the default and switching back is one setting; ISC-17 reworded for the configured version; risk: 2.0 documents no revocation endpoint, so ISC-65 must be re-proven against a real 2.0 token (affects: ISC-17, ISC-20, ISC-65)

## Learning

- 2026-11-04 · C: `--density 7` on a `--page` override makes the workspace denser than Master · R: page overrides ignore the density dial, and densities 4 to 7 all give the same Standard spacing; only 8 and above switch to the Dense tier · L: read the generated spacing table after every dial change instead of trusting the dial number

- 2026-11-02 · C: Ravelry's cart and checkout API lets a client app buy patterns for a user · R: the docs show carts/* only for seller stores (store_id issued by Ravelry) and external_checkout records payment taken elsewhere · L: read the method's notes, not just its name, before planning a feature on it

## Verification
- 2026-11-04 · ISC-9 · pass · MASTER.md heading check → 5 of 5 headings found
- 2026-11-04 · ISC-63 · pass · Decisions grep for search.py --design-system --persist → match; MASTER.md line 1 = '# Design System Master File'
- 2026-11-04 · ISC-76 · pass · test -s design-system/ravelry-companion-site/pages/workspace.md → exit 0
- 2026-11-04 · ISC-1 · pass · pnpm install --frozen-lockfile && pnpm build → exit 0 (Next.js 16.4.5); pnpm typecheck && pnpm lint → exit 0, 0 errors, 0 warnings; jq scripts check → true
- 2026-11-04 · ISC-2 · pass · after commit 5af059b: git check-ignore -q .env.local → exit 0; tracked .env* other than .env.example → 0
- 2026-11-04 · ISC-10 · pass · pnpm test tests/unit/design-tokens.themes.test.ts → 3/3 pass (22 light color tokens, 0 missing dark; mutation removing dark --scrim fails it)
- 2026-11-04 · ISC-11 · pass · pnpm test tests/unit/design-tokens.contrast.test.ts → 3/3 pass, 15 pairs recomputed from globals.css (mutation to #e2e8f0 input fails at 1.19:1)
- 2026-11-04 · ISC-12 · pass · color-literal grep over src excluding globals.css → 0 matches
- 2026-11-04 · ISC-14 · pass · pnpm test:e2e design-system-catalog + a11y/design-system --project=mobile-375 → 5/5 pass: 4/4 MASTER components in both panels; 0 axe violations light, dark, open modal (mutation to low-contrast muted text fails with color-contrast)
- 2026-11-04 · ISC-6 · pass · ad-network grep over src and package.json → 0 matches
- 2026-11-04 · ISC-21 · pass · pnpm test tests/gateway/rate-limit.test.ts → 6/6 pass: 429 → 503, Retry-After 30/5/120/1/42 for none/5/999/0/date (mutation lifting the cap to 1000 fails it)
- 2026-11-04 · ISC-72 · pass · pnpm test tests/unit/server-only-guard.test.ts → pass: fixture client component importing @/lib/ravelry/client fails next build with a server-only error (mutation removing import 'server-only' lets the build exit 0, so the test fails)
- 2026-11-04 · ISC-15 · pass · Decisions line '2026-11-05 · Design system approved' (principal: "approved"); review device not stated
- 2026-11-04 · ISC-15 · fail · principal approved after reviewing /design-system on desktop ("i use the desktop"); the criterion requires a phone review, so it is not met as written
- 2026-11-04 · ISC-15 · pass · Decisions '2026-11-05 · Design system approved' by the principal after a desktop review, accepted by the amended criterion (Decision 2026-11-05)
- 2026-11-04 · ISC-16 · pass · node scripts/check-api-verification.mjs specs/ravelry-api-verification.md → 27 of 27 rows valid (mutation with a bad status, bad date and missing row fails it); from the full docs pasted 2026-11-05
- 2026-11-04 · ISC-73 · pass · 9/9 section headings in specs/architecture.md; document-answerable [verify] items closed by the full docs; 5 live-probe items tracked under Open items
- 2026-11-04 · ISC-74 · pass · Decisions '2026-11-05 · Architecture approved' by the principal with D1-D6
- 2026-11-11 · ISC-17 · pass · pnpm test:e2e tests/e2e/auth/signin-redirect.spec.ts --project=desktop → pass: 307 to https://auth.ravelry.com/oauth2/auth with 43-char state, code_challenge, S256, offline_access
- 2026-11-11 · ISC-18 · pass · pnpm test tests/gateway/allowlist.test.ts → 4/4: non-allowlisted callback 403, 0 __Host-sid cookies, tokens revoked at Ravelry (mutation allowing everyone fails it)
- 2026-11-11 · ISC-20 · pass · pnpm test tests/gateway/token-refresh.test.ts → 5/5: expired token refreshed server-side, 200, resealed cookie, 0 requests to www.ravelry.com (mutation disabling refresh fails 2 tests)
- 2026-11-11 · ISC-65 · pass · pnpm test tests/gateway/signout.test.ts → 2/2: sign-out clears __Host-sid, 1 revoke call with the refresh token, replayed cookie 401 (mutation skipping revoke fails it)
- 2026-11-11 · ISC-84 · pass · pnpm test tests/gateway/redirect-uri.test.ts → 2/2: redirect_uri equals RAVELRY_REDIRECT_URI when set, APP_URL + /api/auth/callback when unset, on authorize and token exchange (mutation ignoring the env var fails it)


## Articulation Log

### 2026-11-01 15:02 · scaffold — initial request
> Principal request (verbatim): "we need to plan a user-centric/ui-ux site using the skill ui/ux pro installed to create the best site over the ravelry api found https://www.ravelry.com/api and the site overall at ravelry.com"
> 
> Principal answers to scoping questions (2026-11-01):
> - Site type: BOTH public browse + Ravelry sign-in. Anyone can browse/search patterns and yarns without logging in; signing in with Ravelry OAuth 2.0 unlocks a personal workspace for the user's own data.
> - v1 scope: ALL FOUR areas — (1) pattern + yarn discovery (faceted search, pattern detail, yarn substitution/matching); (2) personal workspace (projects, queue, stash, favorites, library, with edits written back to Ravelry); (3) community (forums, messages, friend activity); (4) pattern purchasing via the Ravelry cart/checkout API.
> - Audience: personal / private beta (principal plus a small invited group), not a public launch yet.
> - Stack: Next.js (App Router) + TypeScript + Tailwind CSS, shadcn/ui components; server-side route handlers hold OAuth tokens so they never reach the browser.
> 
> Design requirement: the UI/UX must be produced with the installed ui-ux-pro-max Claude Code plugin (skills ui-ux-pro-max:ui-ux-pro-max, ui-ux-pro-max:design-system, ui-ux-pro-max:ui-styling) — generate a documented design system (tokens, typography, color, components) persisted in the repo and used by every page. User-centric: the goal is a site that is noticeably better to use than ravelry.com itself (which is dense, dated, desktop-first) — mobile-first, accessible (WCAG 2.2 AA), fast, with excellent search/filter UX and photo-forward pattern browsing.
> 
> Ravelry API context (docs at https://www.ravelry.com/api/docs require a Ravelry login, so treat these as facts to verify): REST JSON at https://api.ravelry.com; auth via HTTP basic with read-only or personal keys, or OAuth 2.0 (legacy OAuth 1.0a) for apps acting on behalf of users; app registration requires a Ravelry account (Pro/developer page). Endpoint families include patterns (search, show, multiple), yarns (search, show), yarn_companies, designers, pattern_sources, pattern_categories/attributes, people, projects, stash, queue, favorites, library, packs, photos/upload, messages, forums/topics/posts, friends/activity, carts/checkout/deliveries for purchases, current_user. Terms of use: no implying Ravelry endorsement, attribute Ravelry and photo owners, respect rate limits, no commercial use without permission, no scraping of the website.
> 
> Project state: /home/jhollenbeck/ravelry is a fresh directory (no code yet, not a git repo). This ISA is the planning artifact before any code is written.
**Settled:** first draft of the ladder and criteria by the isa workflow; awaiting Restate.

### 2026-11-01 15:02 · scaffold — workflow critique
> Workflow critique (falsifiability, drift, scope-and-reality lenses) of the first draft, applied before Restate.
**Settled:** L2.b2 now says users edit projects, queue, stash and favorites and browse their library; L2.b4 is rewritten from the summit (instant on a mid-range phone, keyboard and screen reader to WCAG 2.2 AA, a credited model API citizen) and leaves floors to Anti: criteria. Retired ISC-19 (into ISC-3), ISC-22 (into ISC-4), ISC-26 (into ISC-13) and ISC-52 (into ISC-7). Added ISC-54 Core Web Vitals, ISC-55 discovery axe, ISC-56 keyboard flows, ISC-57 anonymous yarn search, ISC-58 stash edit, ISC-59 messages inbox, ISC-60 activity feed, ISC-61 live API smoke, ISC-62 timed comparison with ravelry.com, ISC-63 generator command record, ISC-64 no shadow data store, ISC-65 sign-out, ISC-66 cart axe. Fixed broken double-escaped pipes in every tool cell, guarded every negative grep, fixed the src/ layout and the test harness in Constraints, aligned MASTER.md headings with the real generator output, unified the egress allowlist and one verification note, set one axe bar (0 violations of any impact) and one 44x44 target bar, made capability gating cross-cutting (ISC-45), split or reworded every compound criterion, and encoded the build order as dependencies.

### 2026-11-02 09:00 · extend — principal follow-ups after scaffold
> "we are also hosting this on vercel"
> "phase purchasing and messaging to v1 - we need to get the architecture right for eveything" / "yes, keep them in v1"
> "use the ui-ux-pro-max skill for the design system"
> "go with your recommended density and motion settings"
**Settled:** L2 sentence now names one approved architecture deployed on Vercel; L1 gains a Vercel and architecture-first paragraph. Constraints add Vercel hosting, secrets, caching and the all-areas architecture rule. Added ISC-67, ISC-68, ISC-77, ISC-70 (Vercel deploys and env), ISC-69, ISC-71, ISC-78, ISC-72 (live OAuth on prod, cache headers, server-only client), ISC-73, ISC-74 (architecture doc and approval, now a dependency of ISC-23), ISC-75 (messaging unread polling) and ISC-76 (workspace design-system override). Q8 settled; Q4 narrowed to the session store; Q10 added for preview OAuth redirects. Four Decisions logged.

### 2026-11-02 09:20 · restate — confirmed
> "yes, apply your recommended answers"
**Settled:** principal confirmed L3 and L2 as shown; status set to aligned.

### 2026-11-02 09:20 · refine — take the defaults
> "yes, apply your recommended answers"
**Settled:** Q1 to Q7, Q9 and Q10 accept their recommended answers. Constraints add the Upstash Redis session store, the production plus stable-preview OAuth redirects, the warm photo-forward light/dark direction and the neutral working identity. Q1, Q2 and Q9 resolve through the ISC-16 verification spike. Ladder unchanged.

### 2026-11-02 10:00 · verify — Ravelry API docs pasted by the principal
> Principal pasted "Ravelry API Documentation, Last updated 2026-10-26" (truncated after the groups section).
**Settled:** specs/ravelry-api-verification.md written: 23 capabilities confirmed, carts, checkout and rate-limit unconfirmed. OAuth moves to 2.1 with PKCE at auth.ravelry.com (ISC-17, ISC-4). Purchasing becomes a Buy on Ravelry hand-off: L2.b3 and L1 reworded, ISC-48, ISC-49, ISC-50, ISC-53 and ISC-66 retired, ISC-79, ISC-80 and ISC-81 added, in-site cart added to Out of Scope. API limits added to Constraints. Status back to draft until the L2.b3 change is restated.

### 2026-11-02 10:15 · restate — purchasing hand-off
> L2.b3 reworded to "buy a pattern on Ravelry in one tap from its page, then open the download on the same site." Principal answer: "Yes, hand-off is fine"
**Settled:** principal confirmed the Buy on Ravelry hand-off; status set back to aligned.

### 2026-11-02 11:00 · discuss — name and API gaps
> Fallback if read-only auth cannot search: "Sign-in to search". API gaps: "Paste docs + live probe". Name: "check trademarks and domains for purlwise", then "let's try niddy for now but make it configurable so we can change it if needed"
**Settled:** Niddy is the working name behind one SITE_NAME config value (ISC-82, ISC-83). Sign-in fallback added to Constraints. Q11 (domain) and Q12 (trademark check) opened with recommended answers; Q13 and Q14 settled. Ladder unchanged.

### 2026-11-03 09:00 · refine — domain and redirect URI
> "yes, make the redirect configurable, then continue with your plan"
**Settled:** Q11 answered: production at niddy.vercel.app; redirect URI from RAVELRY_REDIRECT_URI, defaulting to APP_URL + /api/auth/callback (Constraints, ISC-84). Ladder unchanged.

### 2026-11-04 20:15 · verify — design system generated
> "contineu" (continue with the plan: ISC-9 design system, then ISC-1 skeleton)
**Settled:** MASTER.md and pages/workspace.md generated by ui-ux-pro-max (commands in Decisions). Variance 3 replaces the default to avoid Claymorphism. Dark palette and input token hand-derived and contrast-checked. Workspace spacing set to the Dense tier. Awaiting principal approval of the design system (ISC-15). Ladder unchanged.

### 2026-11-04 22:45 · verify — /design-system built
> "yes, commit and build /design-system"
**Settled:** first commit 5af059b (ISC-2 pass). shadcn/ui (base-nova, Base UI) added and themed from MASTER.md: tokens in src/app/globals.css (light, dark class, OS dark preference, workspace density), button and input at 44px with a solid 2px focus ring, dialog scrim token. /design-system catalog renders Buttons, Cards, Inputs and Modals in light and dark panels. ISC-10, ISC-11, ISC-12 and ISC-14 pass, each with a mutation check proving the test can fail. Component-spec overrides recorded in MASTER.md. Next: principal reviews /design-system on a phone for ISC-15.

### 2026-11-05 00:10 · verify — cross-cutting frontier, no deploy
> "do everything except the actual deploy"
**Settled:** built the noindex header and robots.txt, web manifest, server-only Ravelry client with read-only basic auth and a 10 s timeout, the 429 → 503 Retry-After mapping, and /api/patterns. ISC-6, ISC-21 and ISC-72 pass, each with a mutation check. ISC-3, ISC-5, ISC-7, ISC-8, ISC-64 and ISC-82 have their mechanism and every check that can run today passing; their remaining checks need feature routes or sign-in and are registered as pending tests. Deploy criteria (ISC-67, ISC-68, ISC-70, ISC-77) not started, as asked. Ladder unchanged.

### 2026-11-05 09:30 · discuss — sleeker themes
> "can we make dark theme more sleek modern dark" / "change the light too - modern slkeek" / "good"
**Settled:** dark moves from warm brown to near-black charcoal (#0F0F11 → #18181B → #1F1F23 surfaces); light moves from cream to neutral (#FAFAFA, white cards, #E4E4E7 hairlines, #09090B text); terracotta stays the accent (#C2410C light, #F59E78 dark). ISC-10, ISC-11 and ISC-14 re-run and still pass (7/7 unit, 5/5 e2e, 0 axe violations both themes). L1 and the visual-direction constraint reworded; L3/L2 unchanged, so no Restate. Fonts unchanged pending the principal's choice.

### 2026-11-05 10:00 · discuss — font
> "switch to Plus Jakarta Sans"
**Settled:** Plus Jakarta Sans (next/font, self-hosted) for all text; headings semibold with slightly tighter letters and a little extra word space so display headings do not run together. MASTER.md updated. Ladder unchanged.

### 2026-11-05 10:30 · restate — design system approval
> "approved, draft the architecture doc"
**Settled:** ISC-15 approval logged in Decisions. Next: specs/architecture.md (ISC-73) for principal approval (ISC-74).

### 2026-11-05 10:40 · restate — approval device
> "i use the desktop"
**Settled:** the approval stands, but ISC-15 asks for a phone review, so it is unchecked again until the principal either reviews on a phone or changes the criterion.

### 2026-11-05 11:30 · verify — architecture draft
> "approved, draft the architecture doc"
**Settled:** specs/architecture.md drafted with all 9 sections (heading check 9/9). ISC-73 left unchecked because it depends on ISC-16 and the draft carries 6 [verify] items that close with the API verification. Six decisions (D1 Upstash Redis, D2 TanStack Query, D3 24 h reference cache amending ISC-64, D4 zod, D5 encrypted tokens, D6 separate library-pdf token) await the principal; approving the document is ISC-74.

### 2026-11-05 11:45 · discuss — architecture and two amendments
> Architecture: "Approve all six". ISC-64 cache TTL: "Amend: 24 h for lists". ISC-15: "Desktop + mobile tests is fine"
**Settled:** architecture approved (Decisions); ISC-73 and ISC-74 stay unchecked until ISC-16 closes the [verify] items. ISC-64 and ISC-15 reworded as above, both logged as direction changes. Ladder unchanged.

### 2026-11-05 14:00 · verify — full API docs and local env
> "can you add the creds for me for local setup and here are the docs" (full Ravelry API documentation, 2026-10-26)
**Settled:** no credential values were supplied, so .env.local (gitignored, mode 600) was created from .env.example with a generated SESSION_SECRET and APP_URL=http://localhost:3000; the Ravelry fields stay blank for the principal to fill in. The full docs confirm read-only basic auth reaches pattern and yarn search and detail (public browse works without sign-in), unread counts via extras=1, ETags, the documented buy URL (permalink?buy=1), and 100 PDF links per user per day; no general rate limit is published. specs/ravelry-api-verification.md rewritten (24 confirmed, 3 unconfirmed); scripts/check-api-verification.mjs added. ISC-16, ISC-73 and ISC-74 pass. Five live-probe items remain in specs/architecture.md. Ladder unchanged: the public-browse fallback is not needed.

### 2026-11-05 16:00 · discuss — sessions without a database
> "can we do somethign like localstorage" → after options: "Encrypted cookie"
**Settled:** tokens stay out of localStorage (ISC-3); sessions are sealed into an encrypted HttpOnly cookie, with no Redis or Upstash. Correction given to the principal: the refresh token sits in the cookie too, so a copied cookie is only stopped by revocation. Ravelry's discovery document lists a revocation endpoint, so sign-out revokes the token. Cookie max age is 14 days. ISC-64 and ISC-65 reworded; architecture D1 and D5 revised. Ladder unchanged.

### 2026-11-11 10:00 · verify — sign-in flow built
> "yes, build the sign-in flow"
**Settled:** built AES-256-GCM cookie sealing (HKDF from SESSION_SECRET, per-purpose keys), OAuth 2.1 + PKCE sign-in and callback, beta allowlist, refresh (early and on 401, rotation stored), sign-out with RFC 7009 revocation and an Origin check, /api/me/projects, and the header sign-in / sign-out control inside Suspense. ISC-17, ISC-18, ISC-20, ISC-65 and ISC-84 pass, each with a mutation check. A self-review found and fixed a bug: a refresh followed by an upstream error dropped the resealed cookie. ISC-3 browser e2e stays pending until a real sign-in runs. Ladder unchanged.

### 2026-11-12 02:00 · discuss — OAuth 2.0 fallback
> "logged out of ravelry and it didn't worked" / "can we just go to 2/0" / "i have a client id and secret set"
**Settled:** RAVELRY_OAUTH_VERSION added (default 2.1). 2.0 mode uses www.ravelry.com, scope 'offline', and no PKCE; 3 new gateway tests (36/36 pass). .env.local set to 2.0. The client id in .env.local is still the 2.1 key, which www.ravelry.com rejects (invalid_client), so the principal needs an OAuth 2.0 key. ISC-17 reworded. Ladder unchanged.

### 2026-11-12 03:00 · verify — live OAuth 2.0 sign-in and sign-out
> "header shows wrampd now" / "[auth] token revocation (refresh_token) at https://www.ravelry.com/oauth2/revoke -> HTTP 200"
**Settled:** a real sign-in with the OAuth 2.0 key works end to end (tokens, refresh token, all four scopes, a 530-byte sealed cookie, the header shows the user on every page). Sign-out revokes the refresh token at Ravelry (HTTP 200), which closes the 2.0 revocation risk noted for ISC-65. Whether revocation also kills the live access token is still to verify. Ladder unchanged.
