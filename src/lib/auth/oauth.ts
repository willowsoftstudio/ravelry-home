import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { authBase, clientCredentials, redirectUri, scopes, usesPkce } from "./config";

export type TokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
};

export class OAuthError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`OAuth request failed: ${status}${code ? ` ${code}` : ""}`);
    this.name = "OAuthError";
  }
}

const b64url = (buf: Buffer) => buf.toString("base64url");

export function createPkce(): { verifier: string; challenge: string } {
  const verifier = b64url(randomBytes(32)); // 43 chars, within RFC 7636's 43..128
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function createState(): string {
  return b64url(randomBytes(32));
}

export function authorizeUrl(state: string, challenge: string): string {
  const url = new URL(`${authBase()}/oauth2/auth`);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientCredentials().id,
    redirect_uri: redirectUri(),
    scope: scopes().join(" "),
    state,
  });
  if (usesPkce()) {
    params.set("code_challenge", challenge);
    params.set("code_challenge_method", "S256");
  }
  url.search = params.toString();
  return url.toString();
}

function basicAuth(): string {
  const { id, secret } = clientCredentials();
  return `Basic ${Buffer.from(`${encodeURIComponent(id)}:${encodeURIComponent(secret)}`).toString("base64")}`;
}

async function tokenRequest(form: Record<string, string>): Promise<TokenSet> {
  const res = await fetch(`${authBase()}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof body.access_token !== "string") {
    throw new OAuthError(res.status, typeof body.error === "string" ? body.error : undefined);
  }
  const expiresIn = typeof body.expires_in === "number" ? body.expires_in : 3600;
  return {
    accessToken: body.access_token,
    refreshToken: typeof body.refresh_token === "string" ? body.refresh_token : undefined,
    expiresAt: Date.now() + expiresIn * 1000,
    scopes: typeof body.scope === "string" ? body.scope.split(" ").filter(Boolean) : [],
  };
}

export function exchangeCode(code: string, verifier: string): Promise<TokenSet> {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    ...(usesPkce() ? { code_verifier: verifier } : {}),
  });
}

export function refreshTokens(refreshToken: string): Promise<TokenSet> {
  return tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
}

/** RFC 7009 revocation. Best effort: a failure must not block sign-out. */
export async function revokeToken(token: string, hint: "refresh_token" | "access_token"): Promise<boolean> {
  try {
    const res = await fetch(`${authBase()}/oauth2/revoke`, {
      method: "POST",
      headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token, token_type_hint: hint }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (process.env.NODE_ENV !== "production") {
      // Dev only, status code only: shows whether Ravelry's revocation endpoint exists (ISC-65).
      console.info(`[auth] token revocation (${hint}) at ${authBase()}/oauth2/revoke -> HTTP ${res.status}`);
    }
    return res.ok;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[auth] token revocation (${hint}) failed: ${err instanceof Error ? err.name : "error"}`);
    }
    return false;
  }
}
