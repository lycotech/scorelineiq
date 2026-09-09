import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminSessionToken } from "../../../../lib/admin-auth";
import { getPublicOrigin } from "../../../../lib/request-origin";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  const origin = getPublicOrigin(request);

  const expectedPassword = process.env.ADMIN_PASSWORD;
  const token = await adminSessionToken();

  if (!expectedPassword || !token || password !== expectedPassword) {
    const loginUrl = new URL("/admin/login", origin);
    loginUrl.searchParams.set("error", "1");
    if (safeNext !== "/admin") loginUrl.searchParams.set("next", safeNext);
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(new URL(safeNext, origin), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
