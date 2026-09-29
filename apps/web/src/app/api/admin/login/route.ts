import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@scorelineiq/db";
import { ADMIN_SESSION_COOKIE, createAdminSession } from "../../../../lib/admin-auth";
import { getPublicOrigin } from "../../../../lib/request-origin";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  const origin = getPublicOrigin(request);

  const user = email ? await prisma.adminUser.findUnique({ where: { email } }) : null;
  // Always run a bcrypt compare, even for an unknown email, against a
  // fixed dummy hash — otherwise a login attempt for a real vs. made-up
  // email returns in measurably different time (DB lookup miss vs. a
  // full bcrypt compare), which leaks which emails have accounts.
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? "$2a$10$w4PqNt0168dvm2Wje0hHeOyG4RIQzNe5FGuoaLWmtd18vkNYpjo42",
  );

  if (!user || !passwordMatches) {
    const loginUrl = new URL("/admin/login", origin);
    loginUrl.searchParams.set("error", "1");
    if (safeNext !== "/admin") loginUrl.searchParams.set("next", safeNext);
    return NextResponse.redirect(loginUrl, 303);
  }

  const token = await createAdminSession(user);
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
