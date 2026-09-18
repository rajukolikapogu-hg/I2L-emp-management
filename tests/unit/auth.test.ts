import { describe, expect, it } from "vitest";
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
});
