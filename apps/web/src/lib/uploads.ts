import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB — screenshots of bet slips, not large photos

export interface SavedImage {
  publicPath: string;
  width: number;
  height: number;
}

function uploadsRoot(): string {
  const dir = process.env.UPLOADS_DIR;
  if (!dir) throw new Error("UPLOADS_DIR is not set");
  return dir;
}

// Re-validates via sharp rather than trusting the browser-supplied
// mime type — sharp fails to parse anything that isn't a genuine
// image, which is enough protection for an admin-only upload path.
// Writes under a random filename (never the client-supplied one) so
// there's no path-traversal or collision surface.
export async function saveUploadedImage(file: File, subdir: string): Promise<SavedImage> {
  if (file.size > MAX_BYTES) {
    throw new Error(`Image too large (max ${MAX_BYTES / (1024 * 1024)}MB)`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(buffer).metadata();

  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new Error(`Unsupported image format: ${metadata.format ?? "unknown"}`);
  }
  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const extension = metadata.format === "jpeg" ? "jpg" : metadata.format;
  const filename = `${randomUUID()}.${extension}`;

  const dir = path.join(uploadsRoot(), subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return {
    publicPath: `/uploads/${subdir}/${filename}`,
    width: metadata.width,
    height: metadata.height,
  };
}

// Best-effort: a missing file (or unset UPLOADS_DIR) isn't worth
// failing a delete/update request over.
export async function deleteUploadedImage(publicPath: string): Promise<void> {
  if (!process.env.UPLOADS_DIR || !publicPath.startsWith("/uploads/")) return;
  const relative = publicPath.slice("/uploads/".length);
  try {
    await unlink(path.join(uploadsRoot(), relative));
  } catch {
    // ignore
  }
}
