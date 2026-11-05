# Ravelry API verification (ISC-16, ISC-47)

Source: Ravelry API documentation, "Last updated 2026-10-26", pasted in full by the principal on 2026-11-05 (HTML version at https://www.ravelry.com/api). It supersedes the truncated paste of 2026-11-02.

The docs mark every method that needs a signed-in user as **(authenticated)**. Methods without that mark work with read-only basic auth. That answers the biggest open question: **public browse needs no sign-in**.

Status meanings: `confirmed` = the docs show a method this site can use for this capability. `unconfirmed` = not documented, or documented but not usable by this kind of app.

| capability | status | checked | evidence | notes |
|---|---|---|---|---|
| patterns-search | confirmed | 2026-11-05 | https://www.ravelry.com/api | `GET /patterns/search.json`, **not authenticated**: read-only basic auth works. `page_size` defaults to 100. Accepts "any of the (many) parameters for filters that are available in the on-site pattern search"; their names are not listed, so the live probe records them |
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
| oauth2-scopes | confirmed | 2026-11-05 | https://www.ravelry.com/api | OAuth 2.1 with PKCE (S256) at `https://auth.ravelry.com/oauth2/auth` and `/oauth2/token`; client id and secret in the Authorization header; redirect URI must match exactly; tokens last 1 h. Scopes: `offline_access forum-write message-write deliveries-read`, plus `library-pdf` on a separate token |
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

## Allowed outbound hosts (ISC-4)

- `api.ravelry.com`: API calls for confirmed capabilities only
- `auth.ravelry.com`: `/oauth2/auth` and `/oauth2/token` only
- Image and delivery hosts: **[live probe]**, recorded from real responses

## Still to verify with a live call (needs the read-only key in .env.local)

1. The filter parameter names for `patterns/search` and `yarns/search` (craft, category, weight, availability/free, yardage, needle size, difficulty, attributes, designer).
2. The image hosts in `Photo` URLs and the host of `generate_download_link` URLs.
3. Whether `copyright_holder` is set on pattern photos.
4. Response latency from the deploy region.
