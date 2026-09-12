import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@scorelineiq/db";
import { deleteUploadedImage } from "../../../../../../lib/uploads";
import { getPublicOrigin } from "../../../../../../lib/request-origin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const redirectUrl = new URL("/admin/accumulators", getPublicOrigin(request));

  try {
    const existing = await prisma.accumulatorPost.findUniqueOrThrow({ where: { id } });
    await prisma.accumulatorPost.delete({ where: { id } });
    await deleteUploadedImage(existing.imagePath);
    redirectUrl.searchParams.set("result", "deleted");
  } catch (error) {
    redirectUrl.searchParams.set("result", "error");
    redirectUrl.searchParams.set("reason", error instanceof Error ? error.message : "Unknown error");
  }

  return NextResponse.redirect(redirectUrl, 303);
}
