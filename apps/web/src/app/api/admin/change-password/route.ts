import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@scorelineiq/db";
import { ADMIN_SESSION_COOKIE, MIN_PASSWORD_LENGTH, verifyAdminSession } from "../../../../lib/admin-auth";
import { getPublicOrigin } from "../../../../lib/request-origin";

export async function POST(request: NextRequest) {
  const origin = getPublicOrigin(request);
  const redirectUrl = new URL("/admin/change-password", origin);

  const fail = (reason: string) => {
    redirectUrl.searchParams.set("result", "error");
    redirectUrl.searchParams.set("reason", reason);
    return NextResponse.redirect(redirectUrl, 303);
  };

  // middleware.ts already gates every /api/admin/* route on a valid
  // session, but it only checks the signature/expiry — it doesn't load
  // the user. Re-verify here to get the id this request is actually
  // acting as, rather than trusting a client-supplied email.
  const session = await verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) return fail("Your session has expired — sign in again.");

  const formData = await request.formData();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const user = await prisma.adminUser.findUnique({ where: { id: session.id } });
  if (!user) return fail("Your account no longer exists.");

  const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentMatches) return fail("Current password is incorrect.");

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return fail(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (newPassword !== confirmPassword) {
    return fail("New password and confirmation don't match.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });

  redirectUrl.searchParams.set("result", "success");
  return NextResponse.redirect(redirectUrl, 303);
}
