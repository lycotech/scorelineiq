import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Called by the score-results and generate-predictions jobs so a match
// page updates immediately after full-time or a new prediction, rather
// than waiting for its time-based ISR window to expire (docs/TODO.md:
// "ISR wiring — regenerate on schedule + on-demand post-kickoff").
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paths = body?.paths;
  if (!Array.isArray(paths) || paths.some((p) => typeof p !== "string")) {
    return NextResponse.json({ error: "paths must be an array of strings" }, { status: 400 });
  }

  for (const path of paths as string[]) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: paths });
}
