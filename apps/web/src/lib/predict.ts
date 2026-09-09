import { prisma } from "@scorelineiq/db";
import { triggerRevalidate } from "./revalidate";

export interface PredictResponse {
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  predicted_score_home: number;
  predicted_score_away: number;
  over_2_5_probability: number;
  btts_probability: number;
  expected_total_goals: number;
  confidence: number;
  model_version: string;
}

export interface TeamWithStats {
  id: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  played: number | null;
  eloRating: number;
}

export function hasUsableStats(team: TeamWithStats): boolean {
  return team.played !== null && team.played > 0 && team.goalsFor !== null && team.goalsAgainst !== null;
}

export async function callPredict(
  homeTeam: TeamWithStats,
  awayTeam: TeamWithStats,
  leagueAvgGoals: number,
): Promise<PredictResponse> {
  const baseUrl = process.env.PREDICTION_API_URL;
  if (!baseUrl) {
    throw new Error("PREDICTION_API_URL is not set");
  }

  const response = await fetch(`${baseUrl}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      home_team: {
        goals_for_avg: homeTeam.goalsFor! / homeTeam.played!,
        goals_against_avg: homeTeam.goalsAgainst! / homeTeam.played!,
        elo_rating: homeTeam.eloRating,
      },
      away_team: {
        goals_for_avg: awayTeam.goalsFor! / awayTeam.played!,
        goals_against_avg: awayTeam.goalsAgainst! / awayTeam.played!,
        elo_rating: awayTeam.eloRating,
      },
      league_avg_goals: leagueAvgGoals,
    }),
  });

  if (!response.ok) {
    throw new Error(`prediction-api /predict failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as PredictResponse;
}

export async function leagueAverageGoals(leagueId: string): Promise<number | null> {
  const teams = await prisma.team.findMany({
    where: { leagueId, played: { gt: 0 } },
    select: { goalsFor: true, played: true },
  });

  if (teams.length === 0) return null;

  const totalGoals = teams.reduce((sum, t) => sum + (t.goalsFor ?? 0), 0);
  const totalPlayed = teams.reduce((sum, t) => sum + (t.played ?? 0), 0);
  if (totalPlayed === 0) return null;

  return totalGoals / totalPlayed;
}

export type GeneratePredictionResult =
  | { status: "generated"; prediction: PredictResponse }
  | { status: "pending"; reason: string };

// The single-fixture path used by both the nightly cron job and the
// admin "generate with model" button — one code path so the admin
// tool can never drift from what the automated pipeline actually
// does.
export async function generatePredictionForFixture(fixtureId: string): Promise<GeneratePredictionResult> {
  const fixture = await prisma.fixture.findUniqueOrThrow({
    where: { id: fixtureId },
    select: {
      id: true,
      slug: true,
      leagueId: true,
      homeTeam: { select: { id: true, goalsFor: true, goalsAgainst: true, played: true, eloRating: true } },
      awayTeam: { select: { id: true, goalsFor: true, goalsAgainst: true, played: true, eloRating: true } },
    },
  });

  if (!hasUsableStats(fixture.homeTeam) || !hasUsableStats(fixture.awayTeam)) {
    return { status: "pending", reason: "One or both teams have no season stats synced yet" };
  }

  const leagueAvgGoals = await leagueAverageGoals(fixture.leagueId);
  if (!leagueAvgGoals || leagueAvgGoals <= 0) {
    return { status: "pending", reason: "No league-average-goals baseline available yet" };
  }

  const prediction = await callPredict(fixture.homeTeam, fixture.awayTeam, leagueAvgGoals);

  await prisma.prediction.upsert({
    where: { fixtureId: fixture.id },
    create: {
      fixtureId: fixture.id,
      homeWinProbability: prediction.home_win_probability,
      drawProbability: prediction.draw_probability,
      awayWinProbability: prediction.away_win_probability,
      predictedScoreHome: prediction.predicted_score_home,
      predictedScoreAway: prediction.predicted_score_away,
      over25Probability: prediction.over_2_5_probability,
      bttsProbability: prediction.btts_probability,
      expectedGoals: prediction.expected_total_goals,
      confidence: prediction.confidence,
      modelVersion: prediction.model_version,
    },
    update: {
      homeWinProbability: prediction.home_win_probability,
      drawProbability: prediction.draw_probability,
      awayWinProbability: prediction.away_win_probability,
      predictedScoreHome: prediction.predicted_score_home,
      predictedScoreAway: prediction.predicted_score_away,
      over25Probability: prediction.over_2_5_probability,
      bttsProbability: prediction.btts_probability,
      expectedGoals: prediction.expected_total_goals,
      confidence: prediction.confidence,
      modelVersion: prediction.model_version,
      generatedAt: new Date(),
    },
  });

  await triggerRevalidate(["/", `/match/${fixture.slug}`]);

  return { status: "generated", prediction };
}

export interface ManualPredictionInput {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedScoreHome: number;
  predictedScoreAway: number;
  over25Probability: number;
  bttsProbability: number;
  expectedGoals: number;
  confidence: number;
}

// Manual entries are tagged with a distinct modelVersion so the public
// site's "Model version" disclosure on every match page stays honest —
// it will literally say "manual-override" rather than implying the
// Poisson/Elo model produced this number.
export async function saveManualPrediction(fixtureId: string, input: ManualPredictionInput) {
  const fixture = await prisma.fixture.findUniqueOrThrow({
    where: { id: fixtureId },
    select: { id: true, slug: true },
  });

  await prisma.prediction.upsert({
    where: { fixtureId: fixture.id },
    create: {
      fixtureId: fixture.id,
      ...input,
      modelVersion: "manual-override",
    },
    update: {
      ...input,
      modelVersion: "manual-override",
      generatedAt: new Date(),
    },
  });

  await triggerRevalidate(["/", `/match/${fixture.slug}`]);
}
