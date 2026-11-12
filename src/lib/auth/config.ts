import "server-only";

// OAuth 2.1 settings for Ravelry (specs/ravelry-api-verification.md, oauth2-scopes).

/**
 * Which Ravelry OAuth flavour to use (RAVELRY_OAUTH_VERSION, default "2.1").
 * 2.1: auth.ravelry.com, PKCE required, "offline_access" for refresh tokens.
 * 2.0: www.ravelry.com, no PKCE in the docs, "offline" for refresh tokens.
 * 2.0 is the fallback while Ravelry's 2.1 login page returns 500
 * (specs/ravelry-bug-report-oauth21-login-500.md).
 */
export type OAuthVersion = "2.0" | "2.1";
export function oauthVersion(): OAuthVersion {
  return process.env.RAVELRY_OAUTH_VERSION?.trim() === "2.0" ? "2.0" : "2.1";
}

export const usesPkce = () => oauthVersion() === "2.1";

const FEATURE_SCOPES = ["forum-write", "message-write", "deliveries-read"];

/** Requested scopes. RAVELRY_SCOPES (space-separated) overrides the default, e.g. to diagnose consent errors. */
export function scopes(): string[] {
  const fromEnv = process.env.RAVELRY_SCOPES?.trim();
  if (fromEnv) return fromEnv.split(/\s+/);
  return [oauthVersion() === "2.0" ? "offline" : "offline_access", ...FEATURE_SCOPES];
}

export function authBase(): string {
  const fallback = oauthVersion() === "2.0" ? "https://www.ravelry.com" : "https://auth.ravelry.com";
  return (process.env.RAVELRY_AUTH_BASE || fallback).replace(/\/+$/, "");
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
