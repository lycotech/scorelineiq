import { prisma, FixtureStatus } from "@scorelineiq/db";
import { runJob } from "../lib/job-runner";
import { triggerRevalidate } from "../lib/revalidate";

interface PredictResponse {
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  predicted_score_home: number;
  predicted_score_away: number;
  over_2_5_probability: number;
  btts_probability: number;
  confidence: number;
  model_version: string;
}

interface TeamWithStats {
  id: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  played: number | null;
  eloRating: number;
}

function hasUsableStats(team: TeamWithStats): boolean {
  return team.played !== null && team.played > 0 && team.goalsFor !== null && team.goalsAgainst !== null;
}

async function callPredict(
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

async function leagueAverageGoals(leagueId: string): Promise<number | null> {
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

async function generatePredictions() {
  const fixtures = await prisma.fixture.findMany({
    where: {
      status: FixtureStatus.SCHEDULED,
      kickoffAt: { gte: new Date() },
    },
    select: {
      id: true,
      slug: true,
      leagueId: true,
      homeTeam: {
        select: { id: true, goalsFor: true, goalsAgainst: true, played: true, eloRating: true },
      },
      awayTeam: {
        select: { id: true, goalsFor: true, goalsAgainst: true, played: true, eloRating: true },
      },
    },
  });

  let generated = 0;
  let pending = 0;
  let failed = 0;

  const leagueAvgCache = new Map<string, number | null>();

  for (const fixture of fixtures) {
    if (!hasUsableStats(fixture.homeTeam) || !hasUsableStats(fixture.awayTeam)) {
      // Team hasn't been through sync-teams-and-form yet — the match
      // page must show "prediction pending", never a guessed number.
      pending += 1;
      continue;
    }

    if (!leagueAvgCache.has(fixture.leagueId)) {
      leagueAvgCache.set(fixture.leagueId, await leagueAverageGoals(fixture.leagueId));
    }
    const leagueAvgGoals = leagueAvgCache.get(fixture.leagueId);

    if (!leagueAvgGoals || leagueAvgGoals <= 0) {
      pending += 1;
      continue;
    }

    try {
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
          confidence: prediction.confidence,
          modelVersion: prediction.model_version,
          generatedAt: new Date(),
        },
      });

      await triggerRevalidate(["/", `/match/${fixture.slug}`]);

      generated += 1;
    } catch (error) {
      console.error(`[generate-predictions] failed for fixture ${fixture.id}:`, error);
      failed += 1;
    }
  }

  return { generated, pending, failed, total: fixtures.length };
}

async function main() {
  console.log("[generate-predictions] generating predictions for upcoming fixtures");
  const result = await generatePredictions();
  console.log(
    `[generate-predictions] done: ${result.generated} generated, ${result.pending} pending (no stats yet), ` +
      `${result.failed} failed, ${result.total} total`,
  );
}

runJob("generate-predictions", main);
