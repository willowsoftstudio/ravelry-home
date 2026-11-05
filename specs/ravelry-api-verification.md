# Ravelry API verification (ISC-16, ISC-47)

Source: Ravelry API documentation, "Last updated 2026-10-26", pasted by the principal on 2026-11-02 (HTML version at https://www.ravelry.com/api).
The paste was truncated after the `groups` section. Sections for library, messages, patterns, people, photos, projects, queue, stash, topics, upload, volumes and yarns were seen **only in the method index**: the methods exist, but their auth level, parameters and per-method rate limits are not yet read. Those rows say "index only" in the notes.

Status meanings: `confirmed` = the docs show a method this site can use for this capability. `unconfirmed` = not shown, or shown but not usable by this kind of app.

| capability | status | checked | evidence | notes |
|---|---|---|---|---|
| patterns-search | confirmed | 2026-11-02 | https://www.ravelry.com/api | `patterns/search` in index. Index only: is read-only basic auth enough? Needed for public browse |
| patterns-show | confirmed | 2026-11-02 | https://www.ravelry.com/api | `patterns/show`, `patterns/patterns` (multiple). Index only |
| pattern-categories | confirmed | 2026-11-02 | https://www.ravelry.com/api | `pattern_categories/list` |
| pattern-attributes | confirmed | 2026-11-02 | https://www.ravelry.com/api | `pattern_attributes/list`; also `/yarn_weights`, `/color_families`, `/fiber_attributes` (cache up to 24 h) |
| yarns-search | confirmed | 2026-11-02 | https://www.ravelry.com/api | `yarns/search`. Index only |
| yarns-show | confirmed | 2026-11-02 | https://www.ravelry.com/api | `yarns/show`, `yarns/yarns` (multiple). Index only |
| current-user | confirmed | 2026-11-02 | https://www.ravelry.com/api | `GET /current_user.json`, authenticated |
| projects-read | confirmed | 2026-11-02 | https://www.ravelry.com/api | `projects/list`, `projects/show`. Index only |
| projects-write | confirmed | 2026-11-02 | https://www.ravelry.com/api | `projects/update`, `projects/create`. Index only |
| stash-read | confirmed | 2026-11-02 | https://www.ravelry.com/api | `stash/list`, `stash/unified/list`. Index only |
| stash-write | confirmed | 2026-11-02 | https://www.ravelry.com/api | `stash/update`. Index only |
| queue-read | confirmed | 2026-11-02 | https://www.ravelry.com/api | `queue/list`, `queue/order`. Index only |
| queue-write | confirmed | 2026-11-02 | https://www.ravelry.com/api | `queue/create`, `queue/delete`, `queue/reposition`. Index only |
| favorites-read | confirmed | 2026-11-02 | https://www.ravelry.com/api | `GET /people/{username}/favorites/list.json`, page_size max 100 |
| favorites-write | confirmed | 2026-11-02 | https://www.ravelry.com/api | `favorites/create` (`{type, favorited_id}`), `favorites/delete` |
| library-read | confirmed | 2026-11-02 | https://www.ravelry.com/api | `library/search`, `volumes/show`. PDF download needs the `library-pdf` scope; those tokens expire sooner, so hold a second token |
| photos-upload | confirmed | 2026-11-02 | https://www.ravelry.com/api | `upload/request_token` → `upload/image` → `projects/create_photo` → `photos/status`. Index only |
| messages-read | confirmed | 2026-11-02 | https://www.ravelry.com/api | `messages/list`, `messages/show`, `mark_read`. Ravelry publishes a "Polling for unread messages" guide (not yet read) |
| messages-send | confirmed | 2026-11-02 | https://www.ravelry.com/api | `messages/create`, `messages/reply`; scope `message-write` |
| forums-read | confirmed | 2026-11-02 | https://www.ravelry.com/api | `forums/sets`, `forums/topics`, `forums/filtered_topics`, `topics/posts`. Do not poll `forum_posts/unread` (docs: "this is being called too much") |
| forums-post | confirmed | 2026-11-02 | https://www.ravelry.com/api | `topics/reply`, `topics/create`; scope `forum-write` |
| friends-activity | confirmed | 2026-11-02 | https://www.ravelry.com/api | `GET /people/{username}/friends/activity.json`; 5 activity types; nothing older than 30 days; page_size max 50 |
| carts | unconfirmed | 2026-11-02 | https://www.ravelry.com/api | `carts/*` exist, but only for **seller stores**: `carts/create` needs a `store_id` owned by the app's Pro account, enabled by Ravelry on request. Not a buyer-side cart |
| checkout | unconfirmed | 2026-11-02 | https://www.ravelry.com/api | `carts/external_checkout` marks a seller-store cart as paid externally. `in_store_sales/checkout` bills a retail shop wholesale. Neither lets a third-party app check out arbitrary patterns for a buyer |
| deliveries | confirmed | 2026-11-02 | https://www.ravelry.com/api | `GET /deliveries/list.json`; scope `deliveries-read`; page_size max 100 |
| oauth2-scopes | confirmed | 2026-11-02 | https://www.ravelry.com/api | OAuth 2.1 with PKCE (S256) at `https://auth.ravelry.com/oauth2/auth` and `/token`; client id and secret go in the Authorization header; redirect URI must match exactly. Scopes: `offline_access forum-write message-write deliveries-read`, plus `library-pdf` on a separate token |
| rate-limit | unconfirmed | 2026-11-02 | https://www.ravelry.com/api | 429 with "per-method limits" that are not stated in the pasted part. 504 when a response takes more than 10 s; keep page_size ≤ 100. ETags are supported |

checkout_mode: hosted-handoff
checkout_checked: 2026-11-02
checkout_source: https://www.ravelry.com/api

## Allowed outbound hosts (ISC-4)

- `api.ravelry.com`: API calls for confirmed capabilities only
- `auth.ravelry.com`: `/oauth2/auth` and `/oauth2/token` only
- Image and delivery hosts: still to be recorded from live responses during the spike

## Still to verify (needs the rest of the docs or a live call)

1. Can read-only basic auth call `patterns/search`, `patterns/show`, `yarns/search` and `yarns/show`? This decides whether public browse works without sign-in.
2. The per-method rate limits.
3. The image and delivery hosts in real responses.
4. The "Polling for unread messages" and "Etags" guides.
