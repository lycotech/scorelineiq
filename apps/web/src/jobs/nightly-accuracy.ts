import { prisma, ResultOutcome } from "@scorelineiq/db";
import { runJob } from "../lib/job-runner";

const MARKETS = ["1X2", "CORRECT_SCORE", "OVER_UNDER_2_5", "BTTS"] as const;
type Market = (typeof MARKETS)[number];

const WINDOWS = {
  ALL_TIME: null,
  LAST_30_DAYS: 30 * 24 * 60 * 60 * 1000,
} as const;
type WindowLabel = keyof typeof WINDOWS;

interface ScoredFixture {
  leagueId: string;
  homeScore: number;
  awayScore: number;
  outcome: ResultOutcome;
  scoredAt: Date;
  prediction: {
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    predictedScoreHome: number;
    predictedScoreAway: number;
    over25Probability: number;
    bttsProbability: number;
  };
}

function predictedOutcome(p: ScoredFixture["prediction"]): ResultOutcome {
  const max = Math.max(p.homeWinProbability, p.drawProbability, p.awayWinProbability);
  if (max === p.homeWinProbability) return ResultOutcome.HOME_WIN;
  if (max === p.drawProbability) return ResultOutcome.DRAW;
  return ResultOutcome.AWAY_WIN;
}

function isHit(market: Market, f: ScoredFixture): boolean {
  const totalGoals = f.homeScore + f.awayScore;
  const bothScored = f.homeScore > 0 && f.awayScore > 0;

  switch (market) {
    case "1X2":
      return predictedOutcome(f.prediction) === f.outcome;
    case "CORRECT_SCORE":
      return (
        f.prediction.predictedScoreHome === f.homeScore &&
        f.prediction.predictedScoreAway === f.awayScore
      );
    case "OVER_UNDER_2_5": {
      const predictedOver = f.prediction.over25Probability > 0.5;
      const actualOver = totalGoals > 2.5;
      return predictedOver === actualOver;
    }
    case "BTTS": {
      const predictedYes = f.prediction.bttsProbability > 0.5;
      return predictedYes === bothScored;
    }
  }
}

async function fetchScoredFixtures(): Promise<ScoredFixture[]> {
  const fixtures = await prisma.fixture.findMany({
    where: { result: { isNot: null }, prediction: { isNot: null } },
    select: {
      leagueId: true,
      result: {
        select: { homeScore: true, awayScore: true, outcome: true, scoredAt: true },
      },
      prediction: {
        select: {
          homeWinProbability: true,
          drawProbability: true,
          awayWinProbability: true,
          predictedScoreHome: true,
          predictedScoreAway: true,
          over25Probability: true,
          bttsProbability: true,
        },
      },
    },
  });

  return fixtures
    .filter((f) => f.result && f.prediction)
    .map((f) => ({
      leagueId: f.leagueId,
      homeScore: f.result!.homeScore,
      awayScore: f.result!.awayScore,
      outcome: f.result!.outcome,
      scoredAt: f.result!.scoredAt,
      prediction: f.prediction!,
    }));
}

async function computeAccuracy() {
  const scoredFixtures = await fetchScoredFixtures();
  const leagueIds = [...new Set(scoredFixtures.map((f) => f.leagueId))];

  let statsWritten = 0;

  for (const leagueId of leagueIds) {
    const leagueFixtures = scoredFixtures.filter((f) => f.leagueId === leagueId);

    for (const windowLabel of Object.keys(WINDOWS) as WindowLabel[]) {
      const maxAgeMs = WINDOWS[windowLabel];
      const windowFixtures =
        maxAgeMs === null
          ? leagueFixtures
          : leagueFixtures.filter((f) => Date.now() - f.scoredAt.getTime() <= maxAgeMs);

      if (windowFixtures.length === 0) continue;

      for (const market of MARKETS) {
        const totalCount = windowFixtures.length;
        const hitCount = windowFixtures.filter((f) => isHit(market, f)).length;
        const hitRate = hitCount / totalCount;

        await prisma.accuracyStat.upsert({
          where: {
            leagueId_market_windowLabel: { leagueId, market, windowLabel },
          },
          create: { leagueId, market, windowLabel, totalCount, hitCount, hitRate },
          update: { totalCount, hitCount, hitRate, computedAt: new Date() },
        });
        statsWritten += 1;
      }
    }
  }

  return { statsWritten, leaguesProcessed: leagueIds.length, fixturesConsidered: scoredFixtures.length };
}

async function main() {
  console.log("[nightly-accuracy] recomputing rolling accuracy stats");
  const result = await computeAccuracy();
  console.log(
    `[nightly-accuracy] done: ${result.statsWritten} stat rows written across ${result.leaguesProcessed} league(s), ` +
      `${result.fixturesConsidered} scored fixtures considered`,
  );
}

runJob("nightly-accuracy", main);
