import "server-only";

// Cookie names and attributes (architecture: Sessions). The __Host- prefix
// requires Secure, Path=/ and no Domain, which pins each cookie to our origin.

export const SESSION_COOKIE = "__Host-sid";
export const OAUTH_COOKIE = "__Host-oauth";
export const PDF_COOKIE = "__Host-pdf";

/** Separate HKDF purposes so a sealed value for one cookie never opens as another. */
export const OAUTH_PURPOSE = "oauth-state";

export const SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days
export const OAUTH_MAX_AGE = 10 * 60; // 10 minutes

export const baseCookie = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export type Session = {
  username: string;
  userId: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  scopes: string[];
  issuedAt: number; // epoch ms
};

export type OAuthState = {
  state: string;
  verifier: string;
  returnTo: string;
  exp: number; // epoch ms
};

/** Only same-origin relative paths: "/x" but never "//host" or "/\\host". */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/me";
  return value;
}
