import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// AES-256-GCM sealing for cookie payloads (architecture: Sessions, decision D5).
// Key = HKDF-SHA256(SESSION_SECRET, info=purpose); 96-bit random nonce per seal.
// Output: base64url(version || nonce || ciphertext || tag). Any tampering fails
// the GCM tag check and unseal returns null (treated as signed out).

const VERSION = 1;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

function key(purpose: string): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return Buffer.from(hkdfSync("sha256", secret, "site-cookie-seal-v1", purpose, 32));
}

export function seal(payload: unknown, purpose: string): string {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(purpose), nonce);
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([Buffer.from([VERSION]), nonce, body, cipher.getAuthTag()]).toString("base64url");
}

export function unseal<T>(sealed: string | undefined, purpose: string): T | null {
  if (!sealed) return null;
  try {
    const raw = Buffer.from(sealed, "base64url");
    if (raw.length < 1 + NONCE_BYTES + TAG_BYTES + 1 || raw[0] !== VERSION) return null;
    const nonce = raw.subarray(1, 1 + NONCE_BYTES);
    const tag = raw.subarray(raw.length - TAG_BYTES);
    const body = raw.subarray(1 + NONCE_BYTES, raw.length - TAG_BYTES);
    const decipher = createDecipheriv("aes-256-gcm", key(purpose), nonce);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
