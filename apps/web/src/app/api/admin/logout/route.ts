import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "../../../../lib/admin-auth";
import { getPublicOrigin } from "../../../../lib/request-origin";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", getPublicOrigin(request)), 303);
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
