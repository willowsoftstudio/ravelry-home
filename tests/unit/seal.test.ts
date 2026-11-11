import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seal, unseal } from "@/lib/session/seal";

describe("cookie sealing (AES-256-GCM)", () => {
  beforeEach(() => vi.stubEnv("SESSION_SECRET", "test-secret-0123456789abcdef0123456789abcdef"));
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips a payload and hides its contents", () => {
    const sealed = seal({ accessToken: "tok-secret" }, "session");
    expect(sealed).not.toContain("tok-secret");
    expect(Buffer.from(sealed, "base64url").toString("latin1")).not.toContain("tok-secret");
    expect(unseal(sealed, "session")).toEqual({ accessToken: "tok-secret" });
  });

  it("uses a fresh nonce per seal", () => {
    expect(seal({ a: 1 }, "session")).not.toBe(seal({ a: 1 }, "session"));
  });

  it("rejects a tampered value", () => {
    const raw = Buffer.from(seal({ a: 1 }, "session"), "base64url");
    raw[20] ^= 1;
    expect(unseal(raw.toString("base64url"), "session")).toBeNull();
  });

  it("does not open a value sealed for another purpose", () => {
    expect(unseal(seal({ a: 1 }, "oauth-state"), "session")).toBeNull();
  });

  it("does not open a value sealed with another secret", () => {
    const sealed = seal({ a: 1 }, "session");
    vi.stubEnv("SESSION_SECRET", "another-secret-0123456789abcdef0123456789");
    expect(unseal(sealed, "session")).toBeNull();
  });

  it("refuses to run with a short secret", () => {
    vi.stubEnv("SESSION_SECRET", "short");
    expect(() => seal({ a: 1 }, "session")).toThrow(/SESSION_SECRET/);
  });
});
