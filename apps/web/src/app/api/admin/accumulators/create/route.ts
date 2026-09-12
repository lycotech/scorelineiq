import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@scorelineiq/db";
import { slugify } from "../../../../../lib/slugify";
import { saveUploadedImage } from "../../../../../lib/uploads";
import { getPublicOrigin } from "../../../../../lib/request-origin";

export async function POST(request: NextRequest) {
  const origin = getPublicOrigin(request);
  const redirectUrl = new URL("/admin/accumulators", origin);

  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const image = formData.get("image");

    if (!title) throw new Error("Title is required");
    if (!(image instanceof File) || image.size === 0) throw new Error("Image is required");

    const saved = await saveUploadedImage(image, "accumulator");
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;

    await prisma.accumulatorPost.create({
      data: {
        slug,
        title,
        body,
        imagePath: saved.publicPath,
        imageWidth: saved.width,
        imageHeight: saved.height,
      },
    });

    redirectUrl.searchParams.set("result", "created");
  } catch (error) {
    redirectUrl.searchParams.set("result", "error");
    redirectUrl.searchParams.set("reason", error instanceof Error ? error.message : "Unknown error");
  }

  return NextResponse.redirect(redirectUrl, 303);
}
