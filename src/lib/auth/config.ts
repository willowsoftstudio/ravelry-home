import "server-only";

// OAuth 2.1 settings for Ravelry (specs/ravelry-api-verification.md, oauth2-scopes).

export const SCOPES = ["offline_access", "forum-write", "message-write", "deliveries-read"];

export function authBase(): string {
  return (process.env.RAVELRY_AUTH_BASE || "https://auth.ravelry.com").replace(/\/+$/, "");
}

export function appUrl(): string {
  return (process.env.APP_URL || "https://localhost:3000").replace(/\/+$/, "");
}

/** RAVELRY_REDIRECT_URI, or APP_URL + /api/auth/callback (ISA ISC-84). */
export function redirectUri(): string {
  return process.env.RAVELRY_REDIRECT_URI?.trim() || `${appUrl()}/api/auth/callback`;
}

export function clientCredentials(): { id: string; secret: string } {
  const id = process.env.RAVELRY_CLIENT_ID;
  const secret = process.env.RAVELRY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("RAVELRY_CLIENT_ID and RAVELRY_CLIENT_SECRET must be set");
  return { id, secret };
}

/** BETA_ALLOWLIST: comma-separated Ravelry usernames, matched case-insensitively. */
export function isAllowlisted(username: string): boolean {
  const list = (process.env.BETA_ALLOWLIST ?? "")
    .split(",")
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(username.toLowerCase());
}
