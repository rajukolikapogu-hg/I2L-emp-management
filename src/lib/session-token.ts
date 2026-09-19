// Signed session cookie helpers. Uses Web Crypto only, so this module is safe to
// import from middleware (edge runtime) as well as from server code.

export const SESSION_COOKIE = "emp_session";
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

export const MIN_SECRET_LENGTH = 32;
const encoder = new TextEncoder();

// Only generated in test/development when SESSION_SECRET is unset. It lives for the
// life of the process, so no usable signing key is ever committed to the repository.
let ephemeralSecret: string | null = null;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= MIN_SECRET_LENGTH) return secret;
  const env = process.env.NODE_ENV;
  if (!secret && (env === "test" || env === "development")) {
    ephemeralSecret ??= toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    return ephemeralSecret;
  }
  throw new Error(`SESSION_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters.`);
}

let cachedKey: { secret: string; key: Promise<CryptoKey> } | null = null;

function getKey(): Promise<CryptoKey> {
  const secret = getSecret();
  if (cachedKey?.secret !== secret) {
    const key = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    cachedKey = { secret, key };
  }
  return cachedKey.key;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  // A remainder of 1 can never be produced by base64 encoding.
  if (value.length % 4 === 1) return null;
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function newSessionId(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function signSessionId(sessionId: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(sessionId));
  return `${sessionId}.${toBase64Url(new Uint8Array(sig))}`;
}

/** Returns the session id if the token's signature is valid, otherwise null. */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;
  const sessionId = token.slice(0, dot);
  const signature = fromBase64Url(token.slice(dot + 1));
  if (!signature) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await getKey(),
    signature,
    encoder.encode(sessionId),
  );
  return valid ? sessionId : null;
}
