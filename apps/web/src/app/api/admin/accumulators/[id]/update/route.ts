import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@scorelineiq/db";
import { saveUploadedImage, deleteUploadedImage } from "../../../../../../lib/uploads";
import { getPublicOrigin } from "../../../../../../lib/request-origin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const origin = getPublicOrigin(request);
  const redirectUrl = new URL(`/admin/accumulators/${id}/edit`, origin);

  try {
    const existing = await prisma.accumulatorPost.findUniqueOrThrow({ where: { id } });
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const image = formData.get("image");

    if (!title) throw new Error("Title is required");

    let imageFields = {
      imagePath: existing.imagePath,
      imageWidth: existing.imageWidth,
      imageHeight: existing.imageHeight,
    };

    if (image instanceof File && image.size > 0) {
      const saved = await saveUploadedImage(image, "accumulator");
      imageFields = { imagePath: saved.publicPath, imageWidth: saved.width, imageHeight: saved.height };
      await deleteUploadedImage(existing.imagePath);
    }

    await prisma.accumulatorPost.update({
      where: { id },
      data: { title, body, ...imageFields },
    });

    redirectUrl.searchParams.set("result", "saved");
  } catch (error) {
    redirectUrl.searchParams.set("result", "error");
    redirectUrl.searchParams.set("reason", error instanceof Error ? error.message : "Unknown error");
  }

  return NextResponse.redirect(redirectUrl, 303);
}
