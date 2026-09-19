import { afterEach, describe, expect, it, vi } from "vitest";
import { cookieSecure, validateConfig } from "@/lib/config";
import { checkAdminCredentials, LOGIN_FAILED_MESSAGE } from "@/lib/credentials";
import { signSessionId, verifySessionToken } from "@/lib/session-token";

describe("admin credentials (AUTH-1, AUTH-5)", () => {
  it("accepts only eadmin/epassword", () => {
    expect(checkAdminCredentials("eadmin", "epassword")).toBe(true);
    expect(checkAdminCredentials("eadmin", "wrong")).toBe(false);
    expect(checkAdminCredentials("admin", "epassword")).toBe(false);
    expect(checkAdminCredentials("EADMIN", "epassword")).toBe(false);
    expect(checkAdminCredentials(" eadmin", "epassword")).toBe(false);
    expect(checkAdminCredentials(null, null)).toBe(false);
  });

  it("rejects non-string, empty, prefix and extended inputs", () => {
    expect(checkAdminCredentials(undefined, undefined)).toBe(false);
    expect(checkAdminCredentials("", "")).toBe(false);
    expect(checkAdminCredentials(["eadmin"], ["epassword"])).toBe(false);
    expect(checkAdminCredentials("eadmin", "epasswor")).toBe(false);
    expect(checkAdminCredentials("eadmin", "epassword ")).toBe(false);
    expect(checkAdminCredentials("eadmi", "epassword")).toBe(false);
    expect(checkAdminCredentials("eadmin", "e".repeat(10_000))).toBe(false);
  });

  it("compares with crypto.timingSafeEqual and evaluates both fields", async () => {
    vi.resetModules();
    const timingSafeEqual = vi.fn((a: Buffer, b: Buffer) => a.equals(b));
    vi.doMock("node:crypto", async (importOriginal) => ({
      ...(await importOriginal<typeof import("node:crypto")>()),
      timingSafeEqual,
    }));
    try {
      const { checkAdminCredentials: check } = await import("@/lib/credentials");
      expect(check("wrong-user", "epassword")).toBe(false);
      // Both comparisons ran, on equal-length (SHA-256) buffers, even though the first failed.
      expect(timingSafeEqual).toHaveBeenCalledTimes(2);
      for (const [a, b] of timingSafeEqual.mock.calls) {
        expect(a.length).toBe(32);
        expect(b.length).toBe(32);
      }
    } finally {
      vi.doUnmock("node:crypto");
      vi.resetModules();
    }
  });

  // TC-008: a single message is used for every failure.
  it("uses a message that does not name a field", () => {
    expect(LOGIN_FAILED_MESSAGE).toBe("Invalid username or password.");
  });
});

describe("signed session token (AUTH-2)", () => {
  it("round-trips a signed session id", async () => {
    const token = await signSessionId("abc123");
    expect(await verifySessionToken(token)).toBe("abc123");
  });

  // TC-011
  it("rejects tampered, unsigned, or malformed tokens", async () => {
    const token = await signSessionId("abc123");
    const [id, sig] = token.split(".");
    const flipped = sig[0] === "A" ? `B${sig.slice(1)}` : `A${sig.slice(1)}`;
    expect(await verifySessionToken(`${id}.${flipped}`)).toBeNull();
    expect(await verifySessionToken(`other.${sig}`)).toBeNull();
    expect(await verifySessionToken(id)).toBeNull();
    expect(await verifySessionToken(`${token}.extra`)).toBeNull();
    expect(await verifySessionToken(`${id}.!!!`)).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
  });

  // A signature with an impossible base64 length used to make atob throw.
  it("treats undecodable signatures as unauthenticated instead of throwing", async () => {
    const [id, sig] = (await signSessionId("abc123")).split(".");
    await expect(verifySessionToken("id.A")).resolves.toBeNull();
    await expect(verifySessionToken(`${id}.AAAAA`)).resolves.toBeNull();
    await expect(verifySessionToken(`${id}.${sig}A`)).resolves.toBeNull();
    await expect(verifySessionToken(`${id}.AA`)).resolves.toBeNull();
    await expect(verifySessionToken(`${id}.AAA`)).resolves.toBeNull();
  });
});

describe("session secret (AUTH-2)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function freshModule() {
    vi.resetModules();
    return import("@/lib/session-token");
  }

  it.each(["production", "", "staging"])("requires SESSION_SECRET when NODE_ENV=%j", async (env) => {
    vi.stubEnv("NODE_ENV", env);
    vi.stubEnv("SESSION_SECRET", "");
    const mod = await freshModule();
    await expect(mod.signSessionId("abc")).rejects.toThrow(/SESSION_SECRET/);
  });

  it("rejects a secret shorter than 32 characters, even in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SESSION_SECRET", "x".repeat(31));
    const mod = await freshModule();
    await expect(mod.signSessionId("abc")).rejects.toThrow(/at least 32/);
  });

  it("accepts a 32-character secret in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "p".repeat(32));
    const mod = await freshModule();
    expect(await mod.verifySessionToken(await mod.signSessionId("abc"))).toBe("abc");
  });

  it.each(["test", "development"])("uses a random per-process key when unset in %s", async (env) => {
    vi.stubEnv("NODE_ENV", env);
    vi.stubEnv("SESSION_SECRET", "");
    const first = await freshModule();
    const token = await first.signSessionId("abc");
    expect(await first.verifySessionToken(token)).toBe("abc");
    // A new process (fresh module) gets a different key, so old tokens stop verifying.
    const second = await freshModule();
    expect(await second.verifySessionToken(token)).toBeNull();
  });
});

describe("COOKIE_SECURE config (fail closed)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts exactly true or false", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COOKIE_SECURE", "true");
    expect(cookieSecure()).toBe(true);
    vi.stubEnv("COOKIE_SECURE", "false");
    expect(cookieSecure()).toBe(false);
    expect(() => validateConfig()).not.toThrow();
  });

  it.each([undefined, "", "TRUE", "1", "yes", " true"])(
    "is a startup error in production when COOKIE_SECURE=%j",
    (value) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("COOKIE_SECURE", value);
      expect(() => cookieSecure()).toThrow(/COOKIE_SECURE/);
      expect(() => validateConfig()).toThrow(/COOKIE_SECURE/);
    },
  );

  it("defaults to false outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("COOKIE_SECURE", undefined);
    expect(cookieSecure()).toBe(false);
  });
});
