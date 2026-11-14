import "server-only";
import { ravelryGet } from "./client";
import type { Session } from "@/lib/session/cookies";

// The signed-in user's lists for /me (ISA ISC-32, architecture: Workspace). Endpoints
// are the confirmed rows in specs/ravelry-api-verification.md. Field shapes follow
// Ravelry's docs but are read defensively: every field is optional, and the photo and
// name fields that differ between list types have fallbacks. Nothing is shared-cached.

export const TABS = ["projects", "queue", "stash", "favorites", "library"] as const;
export type Tab = (typeof TABS)[number];
export const TAB_LABELS: Record<Tab, string> = {
  projects: "Projects",
  queue: "Queue",
  stash: "Stash",
  favorites: "Favorites",
  library: "Library",
};

export const ME_PAGE_SIZE = 24;

type Obj = Record<string, unknown>;
type Paginator = { page?: number; page_count?: number; results?: number };

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);

export type ItemPhoto = { src: string; srcSet: string; credit: string | null };
export type WorkspaceItem = {
  key: string;
  title: string;
  subtitle: string | null;
  meta: string | null;
  photo: ItemPhoto | null;
  /** Our own page when we have one (patterns), otherwise ravelry.com. */
  href: string | null;
  external: boolean;
};
export type WorkspaceList = { items: WorkspaceItem[]; page: number; pageCount: number; total: number };

/**
 * A photo the signed-in user may see. Their own photos need no credit; anyone else's
 * is credited by copyright_holder (Ravelry fills it with the member's username for
 * project and stash photos). A photo we can't credit is left out (Decision 2026-11-12;
 * people/show lookups for the rest are still to build).
 */
export function itemPhoto(raw: unknown, viewerId: number): ItemPhoto | null {
  const p = obj(raw);
  if (!p) return null;
  const src = str(p.medium_url) ?? str(p.small2_url) ?? str(p.small_url) ?? str(p.square_url);
  if (!src) return null;
  const own = num(p.user_id) === viewerId;
  const credit = own ? null : str(p.copyright_holder);
  if (!own && !credit) return null;
  const srcSet = [str(p.small2_url) && `${p.small2_url} 320w`, str(p.medium_url) && `${p.medium_url} 500w`, str(p.medium2_url) && `${p.medium2_url} 640w`]
    .filter(Boolean)
    .join(", ");
  return { src, srcSet, credit };
}

/** A cover image from a URL field (library volumes): publisher artwork, no member credit. */
function coverPhoto(...urls: unknown[]): ItemPhoto | null {
  const src = urls.map(str).find(Boolean);
  return src ? { src, srcSet: "", credit: null } : null;
}

const patternHref = (id: unknown) => (num(id) ? `/patterns/${num(id)}` : null);
const RAVELRY = "https://www.ravelry.com";
const u = (username: string) => encodeURIComponent(username);

function project(raw: Obj, s: Session): WorkspaceItem {
  const status = str(raw.status_name);
  const progress = num(raw.progress);
  const permalink = str(raw.permalink);
  return {
    key: `project-${raw.id}`,
    title: str(raw.name) ?? "Untitled project",
    subtitle: str(raw.pattern_name),
    meta: [status, progress !== null && status !== "Finished" ? `${progress}%` : null].filter(Boolean).join(" · ") || null,
    photo: itemPhoto(raw.first_photo ?? raw.photo, s.userId),
    href: permalink ? `${RAVELRY}/projects/${u(s.username)}/${encodeURIComponent(permalink)}` : null,
    external: true,
  };
}

function queued(raw: Obj, s: Session): WorkspaceItem {
  const pattern = obj(raw.pattern);
  const patternId = raw.pattern_id ?? pattern?.id;
  return {
    key: `queue-${raw.id}`,
    title: str(raw.pattern_name) ?? str(raw.short_pattern_name) ?? str(pattern?.name) ?? str(raw.name) ?? "Queued pattern",
    subtitle: str(raw.pattern_author_name) ?? str(obj(pattern?.pattern_author)?.name),
    meta: str(raw.name) && str(raw.name) !== str(raw.pattern_name) ? str(raw.name) : null,
    photo: itemPhoto(raw.best_photo ?? raw.first_photo ?? pattern?.first_photo, s.userId),
    href: patternHref(patternId),
    external: false,
  };
}

function stashItem(raw: Obj, s: Session): WorkspaceItem {
  const yarn = obj(raw.yarn);
  const weight = str(obj(yarn?.yarn_weight)?.name) ?? str(raw.yarn_weight_name);
  const permalink = str(raw.permalink);
  return {
    key: `stash-${raw.id}`,
    title: str(yarn?.name) ?? str(raw.name) ?? "Stash yarn",
    subtitle: str(yarn?.yarn_company_name) ?? str(raw.yarn_company_name),
    meta: [str(raw.colorway_name), weight].filter(Boolean).join(" · ") || null,
    photo: itemPhoto(raw.first_photo ?? raw.photo, s.userId),
    href: permalink ? `${RAVELRY}/people/${u(s.username)}/stash/${encodeURIComponent(permalink)}` : null,
    external: true,
  };
}

const FAVORITE_TYPES: Record<string, string> = {
  pattern: "Pattern", project: "Project", yarn: "Yarn", stash: "Stash", designer: "Designer",
  yarnbrand: "Yarn brand", yarnshop: "Yarn shop", forumpost: "Forum post", bundle: "Bundle",
};

function favorite(raw: Obj, s: Session): WorkspaceItem {
  const type = str(raw.type) ?? "";
  const f = obj(raw.favorited) ?? {};
  const photo = itemPhoto(f.first_photo ?? f.best_photo ?? (Array.isArray(f.photos) ? f.photos[0] : null) ?? f.photo, s.userId);
  return {
    key: `favorite-${raw.id}`,
    title: str(f.name) ?? str(f.title) ?? str(f.pattern_name) ?? "Favorite",
    subtitle: str(obj(f.pattern_author)?.name) ?? str(f.yarn_company_name) ?? str(f.designer_name),
    meta: FAVORITE_TYPES[type] ?? (type || null),
    photo,
    href: type === "pattern" ? patternHref(f.id) : null,
    external: false,
  };
}

function volume(raw: Obj): WorkspaceItem {
  return {
    key: `volume-${raw.id}`,
    title: str(raw.title) ?? str(raw.name) ?? "Library item",
    subtitle: str(raw.author_name),
    meta: str(raw.publisher_name) ?? str(raw.type) ?? null,
    photo: coverPhoto(raw.small_image_url, raw.cover_image_url, raw.square_image_url),
    href: patternHref(raw.pattern_id),
    external: false,
  };
}

type Endpoint = { path: (s: Session) => string; key: string; map: (raw: Obj, s: Session) => WorkspaceItem; params?: Obj };
const ENDPOINTS: Record<Tab, Endpoint> = {
  projects: { path: (s) => `/projects/${u(s.username)}/list.json`, key: "projects", map: project },
  queue: { path: (s) => `/people/${u(s.username)}/queue/list.json`, key: "queued_projects", map: queued },
  stash: { path: (s) => `/people/${u(s.username)}/stash/list.json`, key: "stash", map: stashItem },
  favorites: { path: (s) => `/people/${u(s.username)}/favorites/list.json`, key: "favorites", map: favorite },
  library: { path: (s) => `/people/${u(s.username)}/library/search.json`, key: "volumes", map: (raw) => volume(raw) },
};

/** Pick the result array: the documented key, else the first array in the body. */
function resultArray(body: Obj, key: string): Obj[] {
  const direct = body[key];
  const arr = Array.isArray(direct) ? direct : Object.values(body).find(Array.isArray);
  return (arr ?? []).map(obj).filter((x): x is Obj => x !== null);
}

export async function getList(s: Session, tab: Tab, page = 1, pageSize = ME_PAGE_SIZE): Promise<WorkspaceList> {
  const ep = ENDPOINTS[tab];
  // page_size is always sent: projects/list returns the entire set without one.
  const body = await ravelryGet<Obj>(ep.path(s), { ...(ep.params as Record<string, string>), page, page_size: pageSize }, { kind: "bearer", accessToken: s.accessToken });
  const pg = (obj(body.paginator) ?? {}) as Paginator;
  const items = resultArray(body, ep.key).map((r) => ep.map(r, s));
  return {
    items,
    page: num(pg.page) ?? page,
    pageCount: num(pg.page_count) ?? (items.length ? 1 : 0),
    total: num(pg.results) ?? items.length,
  };
}

/** Each tab's total from its paginator (ISC-32); null when that list failed to load. */
export async function getCounts(s: Session, skip?: Tab): Promise<Record<Tab, number | null>> {
  const entries = await Promise.all(
    TABS.map(async (t) => {
      if (t === skip) return [t, null] as const;
      try {
        return [t, (await getList(s, t, 1, 1)).total] as const;
      } catch {
        return [t, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<Tab, number | null>;
}
