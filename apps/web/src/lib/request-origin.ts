import type { NextRequest } from "next/server";

// Route Handlers running in the standalone server saw request.url
// resolve to the container's own Docker hostname (e.g.
// "https://<container-id>:3000") instead of scorelineiq.com, even
// though Caddy is a plain reverse proxy in front of it — the
// standalone Node server's own address, not the client-facing one.
// Middleware (Edge runtime) doesn't have this problem, but for
// anything that redirects from a Route Handler, build the URL from
// the X-Forwarded-* headers Caddy actually sets, falling back to
// nextUrl.origin for local dev where there's no proxy in front.
export function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return request.nextUrl.origin;
}
