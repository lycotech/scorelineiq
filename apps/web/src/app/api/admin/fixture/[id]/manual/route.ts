import { NextRequest, NextResponse } from "next/server";
import { saveManualPrediction } from "../../../../../../lib/predict";
import { getPublicOrigin } from "../../../../../../lib/request-origin";

function num(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  if (Number.isNaN(value)) throw new Error(`Invalid number for ${key}`);
  return value;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const redirectUrl = new URL(`/admin/fixture/${id}`, getPublicOrigin(request));

  try {
    const formData = await request.formData();
    await saveManualPrediction(id, {
      homeWinProbability: num(formData, "homeWinProbability") / 100,
      drawProbability: num(formData, "drawProbability") / 100,
      awayWinProbability: num(formData, "awayWinProbability") / 100,
      predictedScoreHome: num(formData, "predictedScoreHome"),
      predictedScoreAway: num(formData, "predictedScoreAway"),
      over25Probability: num(formData, "over25Probability") / 100,
      bttsProbability: num(formData, "bttsProbability") / 100,
      expectedGoals: num(formData, "expectedGoals"),
      confidence: num(formData, "confidence"),
    });
    redirectUrl.searchParams.set("result", "saved");
  } catch (error) {
    redirectUrl.searchParams.set("result", "error");
    redirectUrl.searchParams.set("reason", error instanceof Error ? error.message : "Unknown error");
  }

  return NextResponse.redirect(redirectUrl, 303);
}
