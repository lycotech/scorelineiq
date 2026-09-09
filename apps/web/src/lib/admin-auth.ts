export const ADMIN_SESSION_COOKIE = "admin_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// The cookie holds a SHA-256 hash of the admin password rather than
// the plaintext, so it's not directly replayable as the login
// credential even if it leaked from a browser store or log line. Uses
// Web Crypto (not Node's `crypto` module) so this also works from
// middleware, which runs on the Edge runtime.
export async function adminSessionToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return sha256Hex(password);
}

export async function isValidAdminSession(cookieValue: string | undefined): Promise<boolean> {
  const expected = await adminSessionToken();
  if (!expected || !cookieValue) return false;
  return cookieValue === expected;
}
