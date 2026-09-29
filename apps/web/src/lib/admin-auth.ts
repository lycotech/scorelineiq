export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches the cookie's maxAge

interface SessionPayload {
  sub: string; // AdminUser.id
  email: string;
  exp: number; // unix seconds
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Sessions are a signed, stateless token (payload + HMAC signature)
// rather than a DB-backed session table: this file is imported by
// middleware.ts, which runs on the Edge runtime and can't reach
// Postgres via Prisma the way the Node-runtime login route can. The
// login route is the only place that touches the AdminUser table;
// verifying a session here is pure Web Crypto, no DB round-trip.
export async function createAdminSession(user: { id: string; email: string }): Promise<string> {
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
  };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyAdminSession(
  cookieValue: string | undefined,
): Promise<{ id: string; email: string } | null> {
  if (!cookieValue) return null;
  const [payloadB64, signatureB64] = cookieValue.split(".");
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signatureB64),
      new TextEncoder().encode(payloadB64),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
