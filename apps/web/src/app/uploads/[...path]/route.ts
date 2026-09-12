import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

// Next's standalone server (unlike `next dev`) only serves files from
// public/ that existed at build time — it does not re-check the
// filesystem for paths added at runtime. Confirmed live: uploaded
// screenshots 404'd in production despite the file genuinely existing
// on disk in the mounted volume, while working fine locally under
// `next dev`. This route handler serves them explicitly instead.
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Reject any segment that could escape the uploads root.
  if (segments.some((segment) => segment.includes("..") || segment.includes("/") || segment.includes("\\"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uploadsRoot = process.env.UPLOADS_DIR;
  if (!uploadsRoot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const extension = path.extname(segments[segments.length - 1] ?? "").toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(uploadsRoot, ...segments);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("not a file");
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        // Short-lived, not "immutable" — filenames are random per
        // upload so this is safe to cache, but a deleted post's image
        // must actually stop being served within a bounded window
        // rather than staying live on Cloudflare's edge for a year.
        // Confirmed live: an aggressive immutable/max-age here made
        // Cloudflare keep serving a deleted image indefinitely
        // (cf-cache-status: HIT) even after the origin file was gone.
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
