# Ravelry API verification (ISC-16, ISC-47)

Source: Ravelry API documentation, "Last updated 2026-10-26", pasted in full by the principal on 2026-11-05 (HTML version at https://www.ravelry.com/api). It supersedes the truncated paste of 2026-11-02.

The docs mark every method that needs a signed-in user as **(authenticated)**. Methods without that mark work with read-only basic auth. That answers the biggest open question: **public browse needs no sign-in**.

Status meanings: `confirmed` = the docs show a method this site can use for this capability. `unconfirmed` = not documented, or documented but not usable by this kind of app.

| capability | status | checked | evidence | notes |
|---|---|---|---|---|
| patterns-search | confirmed | 2026-11-12 | https://www.ravelry.com/api | `GET /patterns/search.json`, **not authenticated**: read-only basic auth works. `page_size` defaults to 100. Accepts "any of the (many) parameters for filters that are available in the on-site pattern search"; their names are not listed, so the live probe records them |
| patterns-show | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /patterns/{id}.json` and `GET /patterns.json?ids=` (multiple), not authenticated. `Pattern (full)` has price, currency, free, gauge, row_gauge, yardage, sizes_available, pattern_needle_sizes, yarn_weight, packs (suggested yarns), difficulty_average, photos, permalink, download_location |
| pattern-categories | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /pattern_categories/list.json`, no API key needed; Ravelry recommends caching up to 24 h |
| pattern-attributes | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /pattern_attributes/groups.json`; also `/yarn_weights.json`, `/color_families.json`, `/fiber_attributes.json`, `/yarn_attributes/groups.json`; cache up to 24 h |
| yarns-search | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /yarns/search.json`, not authenticated. Sort: best, rating, projects. Filters as on the on-site yarn search (names via the live probe) |
| yarns-show | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /yarns/{id}.json`, not authenticated. `Yarn (full)` has yarn_weight, yarn_fibers (fiber category, type, percentage), min/max_gauge, gauge_divisor, grams, yardage, needle and hook size range, photos |
| current-user | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /current_user.json`, authenticated |
| projects-read | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /projects/{username}/list.json` (page_size defaults to the **entire set**, so always pass one), `GET /projects/{username}/{id}.json` |
| projects-write | confirmed | 2026-11-05 | https://www.ravelry.com/api | `POST /projects/{username}/{id}.json` with `data` = Project (POST): progress, project_status_id, notes, … |
| stash-read | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /people/{username}/stash/list.json`, `…/stash/unified/list.json` |
| stash-write | confirmed | 2026-11-05 | https://www.ravelry.com/api | `POST /people/{username}/stash/{id}.json` with `data` = Stash (POST). Quantity lives on the pack (`pack.skeins`) |
| queue-read | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /people/{username}/queue/list.json` (page_size defaults to 50), `…/queue/order.json` |
| queue-write | confirmed | 2026-11-05 | https://www.ravelry.com/api | `POST …/queue/create.json` (`{pattern_id, sort_order}`), `DELETE …/queue/{id}.json`, `POST …/queue/{id}/reposition.json` |
| favorites-read | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /people/{username}/favorites/list.json`, page_size max 100 |
| favorites-write | confirmed | 2026-11-05 | https://www.ravelry.com/api | `POST …/favorites/create.json` (`{type, favorited_id}`), `DELETE …/favorites/{id}.json` |
| library-read | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /people/{username}/library/search.json` (PDF volumes appear only in the user's own library), `GET /volumes/{id}.json` (volume_attachments carry `product_attachment_id`) |
| photos-upload | confirmed | 2026-11-05 | https://www.ravelry.com/api | `POST /upload/request_token.json` → `POST /upload/image.json` (multipart, PNG/JPEG/HEIC, ≤ 50 MB, not authenticated) → `POST /projects/{username}/{id}/create_photo.json` → `GET /photos/status.json` |
| messages-read | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /messages/list.json?folder=inbox` (`unread_only=1` available), `GET /messages/{id}.json`, `POST /messages/{id}/mark_read.json` |
| messages-send | confirmed | 2026-11-05 | https://www.ravelry.com/api | `POST /messages/create.json`, `POST /messages/{id}/reply.json`; scope `message-write`; 403 if either user has messaging disabled |
| forums-read | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /forums/sets.json`, `GET /forums/{id}/topics.json`, `GET /topics/{id}/posts.json`, `GET /topics/{id}.json`. Do not poll `forum_posts/unread` (docs: "this is being called too much") |
| forums-post | confirmed | 2026-11-05 | https://www.ravelry.com/api | `POST /topics/{id}/reply.json` (`body`, optional `parent_post_id`); scope `forum-write` |
| friends-activity | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /people/{username}/friends/activity.json`; 5 activity types; last 30 days only; page_size max 50; each activity carries a photo and user |
| carts | unconfirmed | 2026-11-05 | https://www.ravelry.com/api | `carts/*` serve **seller stores** only (`store_id` issued by Ravelry). Not a buyer cart |
| checkout | unconfirmed | 2026-11-05 | https://www.ravelry.com/api | `carts/external_checkout` records payment taken elsewhere; `in_store_sales/checkout` bills a retail shop. No buyer checkout for a client app |
| deliveries | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /deliveries/list.json`, scope `deliveries-read`, page_size max 100. PDF links: `POST /product_attachments/{id}/generate_download_link.json`, scope `library-pdf`, **100 requests per user per day** |
| oauth2-scopes | confirmed | 2026-11-05 | https://www.ravelry.com/api | OAuth 2.1 with PKCE (S256) at `https://auth.ravelry.com/oauth2/auth` and `/oauth2/token`; client id and secret in the Authorization header; redirect URI must match exactly; tokens last 1 h. The app's key is OAuth 2.1 (principal, 2026-11-05). Ravelry accepts only https redirect URIs; registered and probed on 2026-11-05: `https://localhost:3000/api/auth/callback` and `https://niddy.vercel.app/api/auth/callback` (both redirect back; `http://localhost` is rejected). Scopes: `offline_access forum-write message-write deliveries-read`, plus `library-pdf` on a separate token |
| rate-limit | unconfirmed | 2026-11-05 | https://www.ravelry.com/api | The docs say 429 means "refer to the documentation for per-method limits", but list a number only for `generate_download_link` (100/day/user) and say forum voting is rate-limited. No general limit is published. 504 past 10 s; keep page_size ≤ 100 |

checkout_mode: hosted-handoff
checkout_checked: 2026-11-05
checkout_source: https://www.ravelry.com/api

## Facts the architecture depends on

- **Buy link.** The docs give the hand-off URL: `https://www.ravelry.com/patterns/library/{permalink}?buy=1` opens the pattern page with the buy box open. Adding `guest_buy=0` forces a Ravelry login (ISC-79).
- **Unread counts without extra calls.** Adding `extras=1` to *any* API call returns `extras: { unread_messages_count, unread_forum_replies }`. The unread badge piggybacks on calls the user already makes, plus a light poll at most every 60 s (ISC-75).
- **ETags.** Every response carries `Etag`. Sending it back in `If-None-Match` returns 304 when nothing changed (ISC-64 cache layer).
- **Photo credit.** `Photo` carries `user_id` and `copyright_holder`. Ravelry sets `copyright_holder` to the member's username for stash and project photos. **[live probe]** whether it is filled for pattern photos, or whether the username needs a lookup.
- **Never send `debug=1`.** The docs forbid logging responses without the user's permission.

## Live probe (2026-11-12, read-only basic auth)

The read-only key works: `patterns/search` answers 200. `/current_user.json` answers 403, which proves it is a read-only key, not a personal key. There are no rate-limit headers.

**ETags:** confirmed. Repeating a call with `If-None-Match: <etag>` returns **304**.

**Result counts cap at 100,000** (`paginator.results`). Compare filters against a narrower query.

**Pattern search filters** (measured against `query=cowl`, 78,268 results):

| Facet | Parameter | Example | Result |
|---|---|---|---|
| Craft | `craft` | `knitting`, `crochet` | 59,673 / 18,065 |
| Category | `pc` | `cowl` | filters |
| Yarn weight | `weight` | `fingering`, `dk` | 10,119 / 13,506 |
| Free / Ravelry download | `availability` | `free`, `ravelry` | 19,361 / 49,982 |
| Fit | `fit` | `adult` | 37,686 |
| Attributes | `pa` | `lace`, `cables` | 10,801 / 8,470 |
| Yardage range | `yardage` | `200\|400` | 34,689 |
| Difficulty range | `diff` | `1\|2` | 7,467 |
| Has photo | `photo` | `yes` | 75,957 |
| Designer | `designer-link` (permalink), `designer` (name) | `andrea-mowry` | 208 |
| Needle / hook size | `needles`, `hooks` | `4`, `5` | **HTTP 500**: value format unknown, so this facet is left out until found |

**An unknown or malformed filter value can make Ravelry answer 500** (`needles=4mm`, `fiberc=wool`). The gateway must only forward whitelisted parameter names with values from the cached reference lists, never raw user text (query text excepted).

**Yarn search filters** (against `query=merino`): `weight=fingering` filters, `fiberc=<fiber category id>` filters (`fiberc=1` gives 43,874; a name gives 500), `discontinued=no` filters. `fibertype`, `wpi` and `texture` are ignored.

**Pattern detail:** `free`, `price` (e.g. `7`), `currency` (`USD`), `permalink`, `download_location.type` (`ravelry`), gauge, yardage, sizes, needle sizes, yarn weight, packs and `difficulty_average` are all present.

**Image hosts** (for `next/image` `remotePatterns` and the egress allowlist): `images4-*.ravelrycache.com` (photos) and `avatars-*.ravelrycache.com` (user avatars). The pattern `url` field can point to external sites (e.g. a yarn company), which is a link to show, never something we fetch.

**Photo credit:** every photo has `user_id`. `copyright_holder` is a free-text credit that is sometimes set ("Julie Nagel for Rosy Green Wool") and often empty. Turning a `user_id` into a username needs `people/show`, which is **authenticated** (403 with the read-only key). Across 12 shawl patterns (173 photos):
- **151** photos belong to the designer: `user_id` matches `pattern_author.users[].id`, which carries the username.
- **0** had `copyright_holder` in that sample.
- **22** have no name available to a visitor who is not signed in.
- Cover photos: 11 of 12 creditable.

## Allowed outbound hosts (ISC-4)

- `api.ravelry.com`: API calls for confirmed capabilities only
- `www.ravelry.com`: `/oauth2/auth`, `/oauth2/token`, `/oauth2/revoke` (OAuth 2.0 fallback)
- `auth.ravelry.com`: `/oauth2/auth`, `/oauth2/token`, `/oauth2/revoke` (OAuth 2.1)
- `images4-*.ravelrycache.com`, `avatars-*.ravelrycache.com`: images, loaded by the browser through `next/image`, never fetched by the gateway

## Still to verify with a live call (needs the read-only key in .env.local)

1. ~~Filter parameter names~~ (done 2026-11-12), except the needle/hook size value format.
2. ~~Image hosts~~ (done 2026-11-12). The host of `generate_download_link` URLs is still open (needs a signed-in library-pdf token).
3. ~~Whether `copyright_holder` is set~~ (done 2026-11-12: sometimes; see Photo credit).
4. Response latency from the deploy region (after the first deploy). From this machine: search ~140–750 ms, pattern detail ~110 ms.
