import { NextRequest, NextResponse } from "next/server";
import { generatePredictionForFixture } from "../../../../../../lib/predict";
import { getPublicOrigin } from "../../../../../../lib/request-origin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const redirectUrl = new URL(`/admin/fixture/${id}`, getPublicOrigin(request));

  try {
    const result = await generatePredictionForFixture(id);
    if (result.status === "generated") {
      redirectUrl.searchParams.set("result", "generated");
    } else {
      redirectUrl.searchParams.set("result", "pending");
      redirectUrl.searchParams.set("reason", result.reason);
    }
  } catch (error) {
    redirectUrl.searchParams.set("result", "error");
    redirectUrl.searchParams.set("reason", error instanceof Error ? error.message : "Unknown error");
  }

  return NextResponse.redirect(redirectUrl, 303);
}
