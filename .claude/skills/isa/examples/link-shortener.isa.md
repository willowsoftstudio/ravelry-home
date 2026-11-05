---
isa_format: 1.0
title: "Snip — internal link shortener"
slug: link-shortener
status: aligned
principal: "Platform team lead"
created: 2026-10-30
updated: 2026-10-30
progress: 2/10
---

<!-- Fictitious teaching example. snip.example.com is an RFC 2606 reserved domain. -->

## Ideal State

### L3 · One sentence

Anyone at the company pastes a long URL into Snip and has a short, memorable link they can trust in under five seconds, and every link still resolves a year later.

### L2 · Summary

Snip is a single-purpose internal shortener where creating, trusting and keeping a link are each guaranteed by the service rather than by the person who made it.

- Creating a link takes one paste and one click, and a custom slug is optional.
- Every link shows who made it and where it goes before anyone is redirected.
- Links never silently break: redirects stay up, and dead targets are flagged to their owner.
- It stays small: no analytics dashboards, no public links, no marketing features.

### L1 · Full articulation

Today people share 300-character dashboard URLs in chat, and the links wrap, break and get mistyped. Some teams use a public shortener, which leaks internal hostnames to a third party. When Snip is done, an engineer pastes a Grafana URL, types `oncall-latency` as the slug, and posts `snip.example.com/oncall-latency` in the incident channel. Everyone who clicks it sees the owner's name and the full target on a preview page, if they want it, and lands on the dashboard in one hop otherwise. A year later the link still works. If the dashboard was deleted, the owner got an email about it the week it happened. The pleasant surprise is that nobody ever thinks about Snip: it is simply the way links are shared.

## Problem

Long internal URLs break in chat and docs. Public shorteners expose internal hostnames and can be deactivated without warning. Nobody owns link rot, so old runbooks are full of dead links.

## Out of Scope

- **No click analytics.** Counting clicks invites a dashboard nobody asked for.
- **No public links.** Snip only serves people on the corporate SSO.
- **No link expiry.** Links are permanent unless their owner deletes them.

## Principles

- Trust beats speed: a preview page that costs one click is better than a redirect nobody can inspect.
- Permanence beats tidiness: we keep a stale link rather than break a runbook.

## Constraints

- Runs on the existing internal Kubernetes cluster; Postgres for storage.
- Redirect p95 ≤ 50ms inside the corporate network.
- SSO via the existing OIDC provider; no local accounts.

## Features

### F0 · Cross-cutting
Why: Snip is private and stays small.

- [x] ISC-1: Every Snip route returns 302 to the SSO login when the request has no session (probe: curl without cookie).
- [ ] ISC-2: Anti: no route under `/stats`, `/analytics` or `/clicks` exists (probe: each returns 404).
- [ ] ISC-3: Anti: a link created with an `expires` field is rejected with HTTP 400.

### F1 · CreateLink
Why: One paste gives a working short link.
Reach: / → textbox "Long URL" ; / → button "Snip it"

- [x] ISC-4: POST `/api/links` with only a `url` returns 201 with a 7-character slug (after: ISC-1).
- [ ] ISC-5: POST `/api/links` with a free custom slug returns 201 with that exact slug (after: ISC-4).
- [ ] ISC-6: POST `/api/links` with a taken custom slug returns 409 with the current owner's name (after: ISC-5).

### F2 · TrustedRedirect
Why: People see who made a link and where it goes.
Reach: /<slug>+ → page "Link preview"

- [ ] ISC-7: GET `/<slug>` returns 302 to the target in ≤ 50ms at p95 over 1,000 requests (after: ISC-4).
- [ ] ISC-8: GET `/<slug>+` shows the owner's name beside the full target URL, with no redirect (after: ISC-4).

### F3 · LinkHealth
Why: Dead targets reach their owner, not the reader.

- [ ] ISC-9: A nightly job sends the owner one email listing every link whose target returned 4xx/5xx 3 nights in a row (after: ISC-4).
- [ ] ISC-10: Anti: regression — no link is deleted by the health job (probe: row count before and after the job is equal).

## Test Strategy

| isc | type | check | threshold | tool | anchors_to |
|-----|------|-------|-----------|------|------------|
| ISC-1 | curl | unauthenticated request redirects to SSO | 302, Location host = sso | `curl -s -o /dev/null -w '%{http_code}' https://snip.example.com/ \| grep -q 302` | L2 |
| ISC-2 | bash | analytics routes absent | all 404 | `for p in stats analytics clicks; do curl -s -o /dev/null -w '%{http_code}\n' https://snip.example.com/$p; done \| grep -vq 404 && exit 1 \|\| exit 0` | scope |
| ISC-3 | test | expiry field rejected | 400 | `npm test -- -t "rejects expires"` | scope |
| ISC-4 | test | create with url only | 201 + 7-char slug | `npm test -- -t "creates random slug"` | L2.b1 |
| ISC-5 | test | create with free custom slug | 201 + same slug | `npm test -- -t "custom slug"` | L2.b1 |
| ISC-6 | test | taken slug conflict | 409 + owner name | `npm test -- -t "slug conflict"` | L2.b2 |
| ISC-7 | bash | redirect latency | p95 ≤ 50ms over 1,000 req | `bash scripts/redirect-p95.sh 1000 50` | L3 |
| ISC-8 | screenshot | preview page shows owner and target | both visible, no redirect | `npx playwright test preview.spec.ts` | L2.b2 |
| ISC-9 | test | owner email after 3 failing nights | exactly 1 email | `npm test -- -t "health digest"` | L2.b3 |
| ISC-10 | test | health job never deletes | row count unchanged | `npm test -- -t "health job is read-only"` | L2.b4 |

## Open Questions

- [ ] Q1: Should a deleted owner's links transfer to their manager? — recommended: yes, automatically, with an email to the manager.

## Decisions

- 2026-10-30 · Preview page lives at `/<slug>+` — because it needs no extra UI and is easy to teach (affects: ISC-8)

## Learning

## Verification

- 2026-10-30 · ISC-1 · pass · `curl … ` → 302 to sso.example.com
- 2026-10-30 · ISC-4 · pass · `npm test -- -t "creates random slug"` → 1 passed

## Articulation Log

### 2026-10-30 09:00 · scaffold — initial prompt
> We need an internal bit.ly. People keep pasting giant Grafana URLs into Slack.
**Settled:** first ladder; private-only and no analytics put in Out of Scope.

### 2026-10-30 09:20 · restate — L3/L2 confirmation
> Yes, but the trust part matters more than speed. People got phished with a fake short link last year.
**Settled:** L2 bullet 2 (preview page) added; Principle "trust beats speed" added; ISC-8 added.
