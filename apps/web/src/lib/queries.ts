import { prisma } from "@scorelineiq/db";
import { summarizeCoverage, utcDay } from "./coverage";
import { applyPlan } from "./evaluation-plan";
import { buildProbabilityReport, type EvalRow } from "./scoring";

const fixtureListSelect = {
  id: true,
  slug: true,
  kickoffAt: true,
  status: true,
  league: { select: { name: true, slug: true } },
  homeTeam: { select: { name: true, slug: true, form: true } },
  awayTeam: { select: { name: true, slug: true, form: true } },
  prediction: {
    select: {
      homeWinProbability: true,
      drawProbability: true,
      awayWinProbability: true,
      predictedScoreHome: true,
      predictedScoreAway: true,
      expectedGoals: true,
      over25Probability: true,
      bttsProbability: true,
      confidence: true,
      generatedAt: true,
    },
  },
  result: { select: { homeScore: true, awayScore: true } },
} as const;

export function dayRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function getUpcomingFixtures(days: number = 2) {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return prisma.fixture.findMany({
    where: { kickoffAt: { gte: now, lt: end } },
    select: fixtureListSelect,
    orderBy: { kickoffAt: "asc" },
  });
}

export async function getFixturesForDate(date: Date) {
  const { start, end } = dayRange(date);
  return prisma.fixture.findMany({
    where: { kickoffAt: { gte: start, lt: end } },
    select: fixtureListSelect,
    orderBy: { kickoffAt: "asc" },
  });
}

export async function getLeagueBySlug(slug: string) {
  const league = await prisma.league.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
    },
  });
  if (!league) return null;

  const [teams, fixtures, accuracy] = await Promise.all([
    prisma.team.findMany({
      where: { leagueId: league.id, played: { not: null } },
      orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        played: true,
        won: true,
        draw: true,
        lost: true,
        goalsFor: true,
        goalsAgainst: true,
        points: true,
      },
    }),
    prisma.fixture.findMany({
      where: { leagueId: league.id, kickoffAt: { gte: new Date() } },
      select: fixtureListSelect,
      orderBy: { kickoffAt: "asc" },
      take: 20,
    }),
    prisma.accuracyStat.findMany({
      where: { leagueId: league.id, windowLabel: "ALL_TIME" },
      select: { market: true, totalCount: true, hitCount: true, hitRate: true },
    }),
  ]);

  return { league, teams, fixtures, accuracy };
}

export async function getFixtureBySlug(slug: string) {
  return prisma.fixture.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      kickoffAt: true,
      status: true,
      league: { select: { id: true, name: true, slug: true, country: true } },
      homeTeam: {
        select: {
          id: true,
          name: true,
          slug: true,
          played: true,
          won: true,
          draw: true,
          lost: true,
          goalsFor: true,
          goalsAgainst: true,
          points: true,
          eloRating: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          slug: true,
          played: true,
          won: true,
          draw: true,
          lost: true,
          goalsFor: true,
          goalsAgainst: true,
          points: true,
          eloRating: true,
        },
      },
      prediction: true,
      result: true,
    },
  });
}

// A handful of other upcoming fixtures in the same league — gives match
// pages (the large majority of the site's URLs) somewhere to link
// onward instead of dead-ending at a breadcrumb, which otherwise leaves
// Google with no path to discover adjacent fixtures from there.
export async function getOtherUpcomingFixturesInLeague(leagueId: string, excludeFixtureId: string, limit = 4) {
  return prisma.fixture.findMany({
    where: {
      leagueId,
      id: { not: excludeFixtureId },
      status: "SCHEDULED",
      kickoffAt: { gte: new Date() },
    },
    select: fixtureListSelect,
    orderBy: { kickoffAt: "asc" },
    take: limit,
  });
}

export async function getAllLeaguesWithUpcomingCounts() {
  const leagues = await prisma.league.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
      _count: { select: { fixtures: true } },
    },
    orderBy: { name: "asc" },
  });
  return leagues;
}

export async function getAccuracyOverview() {
  const stats = await prisma.accuracyStat.findMany({
    where: { windowLabel: "ALL_TIME" },
    select: {
      market: true,
      totalCount: true,
      hitCount: true,
      hitRate: true,
      league: { select: { name: true, slug: true } },
    },
    orderBy: [{ league: { name: "asc" } }, { market: "asc" }],
  });

  const overallByMarket = new Map<string, { total: number; hits: number }>();
  for (const stat of stats) {
    const entry = overallByMarket.get(stat.market) ?? { total: 0, hits: 0 };
    entry.total += stat.totalCount;
    entry.hits += stat.hitCount;
    overallByMarket.set(stat.market, entry);
  }

  return {
    byLeague: stats,
    overall: Array.from(overallByMarket.entries()).map(([market, { total, hits }]) => ({
      market,
      totalCount: total,
      hitCount: hits,
      hitRate: total > 0 ? hits / total : 0,
    })),
  };
}

export async function getAdminFixtures() {
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);

  return prisma.fixture.findMany({
    where: { kickoffAt: { gte: start, lt: end } },
    select: {
      id: true,
      slug: true,
      kickoffAt: true,
      status: true,
      league: { select: { name: true } },
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      prediction: { select: { modelVersion: true, confidence: true, generatedAt: true } },
      result: { select: { homeScore: true, awayScore: true } },
    },
    orderBy: { kickoffAt: "asc" },
  });
}

export async function getAdminFixtureDetail(id: string) {
  return prisma.fixture.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      kickoffAt: true,
      status: true,
      league: { select: { name: true, slug: true } },
      homeTeam: {
        select: {
          id: true,
          name: true,
          played: true,
          won: true,
          draw: true,
          lost: true,
          goalsFor: true,
          goalsAgainst: true,
          eloRating: true,
          form: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          played: true,
          won: true,
          draw: true,
          lost: true,
          goalsFor: true,
          goalsAgainst: true,
          eloRating: true,
          form: true,
        },
      },
      prediction: true,
      result: { select: { homeScore: true, awayScore: true } },
    },
  });
}

export async function getImportedExternalLeagues() {
  const leagues = await prisma.league.findMany({
    where: { externalId: { startsWith: "rapidapi:" } },
    select: { id: true, externalId: true, name: true },
  });
  return new Map(leagues.map((l) => [l.externalId.replace("rapidapi:", ""), l]));
}

export async function getImportedExternalFixtures() {
  const fixtures = await prisma.fixture.findMany({
    where: { externalId: { startsWith: "rapidapi:" } },
    select: { id: true, externalId: true },
  });
  return new Map(fixtures.map((f) => [f.externalId.replace("rapidapi:", ""), f.id]));
}

export async function getAllFixtureSlugsForSitemap() {
  return prisma.fixture.findMany({ select: { slug: true, updatedAt: true, kickoffAt: true } });
}

export async function getAllLeagueSlugsForSitemap() {
  return prisma.league.findMany({ select: { slug: true, updatedAt: true } });
}

// Brier score / calibration over the verifiable record: for every
// finished match, the LAST snapshot recorded before kickoff (the DB
// guarantees it is pre-kickoff and immutable) against the real result.
// Deliberately does not read the overwritable Prediction table.
//
// If a pre-registered EvaluationPlan exists, only the matches it defines
// count (kickoff inside its period, first `targetMatches` in kickoff
// order) and matches played without a prediction are disclosed. With no
// plan the report covers every scored match and is labelled exploratory.
export async function getProbabilityReport() {
  const [plan, planCount] = await Promise.all([
    prisma.evaluationPlan.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.evaluationPlan.count(),
  ]);

  const fixtures = await prisma.fixture.findMany({
    where: {
      result: { isNot: null },
      ...(plan
        ? { kickoffAt: { gte: plan.startsAt, lt: plan.endsAt } }
        : { predictionSnapshots: { some: {} } }),
    },
    orderBy: [{ kickoffAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      kickoffAt: true,
      result: { select: { homeScore: true, awayScore: true } },
      predictionSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          homeWinProbability: true,
          drawProbability: true,
          awayWinProbability: true,
          over25Probability: true,
          bttsProbability: true,
        },
      },
    },
  });

  const withFlag = fixtures.map((f) => ({ ...f, hasPrediction: f.predictionSnapshots.length > 0 }));
  const applied = plan
    ? applyPlan(plan, withFlag, new Date())
    : { included: withFlag.filter((f) => f.hasPrediction), withoutPrediction: 0, status: null };

  const rows: EvalRow[] = [];
  let firstKickoff: Date | null = null;
  let lastKickoff: Date | null = null;
  for (const f of applied.included) {
    const snap = f.predictionSnapshots[0];
    if (!snap || !f.result) continue;
    rows.push({
      pHome: snap.homeWinProbability,
      pDraw: snap.drawProbability,
      pAway: snap.awayWinProbability,
      pOver25: snap.over25Probability,
      pBtts: snap.bttsProbability,
      homeScore: f.result.homeScore,
      awayScore: f.result.awayScore,
    });
    if (!firstKickoff || f.kickoffAt < firstKickoff) firstKickoff = f.kickoffAt;
    if (!lastKickoff || f.kickoffAt > lastKickoff) lastKickoff = f.kickoffAt;
  }

  return {
    plan,
    earlierPlans: Math.max(0, planCount - 1),
    planStatus: applied.status,
    withoutPrediction: applied.withoutPrediction,
    scoredMatches: rows.length,
    report: buildProbabilityReport(rows),
    firstKickoff,
    lastKickoff,
  };
}

// Per-day coverage for fixtures kicking off in [from, to): how many were
// played, predicted before kickoff, graded, and how many the data
// provider listed that we never had (from the daily coverage-audit job).
export async function getCoverage(from: Date, to: Date) {
  const [fixtures, providerRows] = await Promise.all([
    prisma.fixture.findMany({
      where: { kickoffAt: { gte: from, lt: to } },
      select: {
        kickoffAt: true,
        status: true,
        result: { select: { id: true } },
        predictionSnapshots: { take: 1, select: { id: true } },
      },
    }),
    prisma.coverageDay.findMany({ where: { day: { gte: from, lt: to } } }),
  ]);

  return summarizeCoverage(
    fixtures.map((f) => ({
      kickoffAt: f.kickoffAt,
      status: f.status,
      hasSnapshot: f.predictionSnapshots.length > 0,
      hasResult: f.result !== null,
    })),
    providerRows.map((r) => ({
      day: utcDay(r.day),
      providerFinished: r.providerFinished,
      missingFromDb: r.missingFromDb,
      checkedAt: r.checkedAt,
    })),
    new Date(),
  );
}

// ---------------------------------------------------------------------------
// Public prediction history (append-only PredictionSnapshot record)
// ---------------------------------------------------------------------------

export const HISTORY_ROW_LIMIT = 500;

export interface HistoryRow {
  fixtureSlug: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date;
  lockedAt: Date;
  versions: number;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedScoreHome: number;
  predictedScoreAway: number;
  over25Probability: number;
  bttsProbability: number;
  modelVersion: string;
  result: { homeScore: number; awayScore: number } | null;
}

// One row per fixture kicking off in [from, to): the LAST snapshot
// recorded before kickoff (the DB guarantees every snapshot is), plus how
// many versions were recorded in total.
export async function getPredictionHistory(from: Date, to: Date) {
  const [fixtures, bounds, totalSnapshots] = await Promise.all([
    prisma.fixture.findMany({
      where: { kickoffAt: { gte: from, lt: to }, predictionSnapshots: { some: {} } },
      orderBy: { kickoffAt: "desc" },
      take: HISTORY_ROW_LIMIT + 1,
      select: {
        slug: true,
        kickoffAt: true,
        league: { select: { name: true } },
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        result: { select: { homeScore: true, awayScore: true } },
        predictionSnapshots: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.predictionSnapshot.aggregate({ _min: { createdAt: true }, _max: { createdAt: true } }),
    prisma.predictionSnapshot.count(),
  ]);

  const truncated = fixtures.length > HISTORY_ROW_LIMIT;
  const rows: HistoryRow[] = fixtures.slice(0, HISTORY_ROW_LIMIT).map((f) => {
    const latest = f.predictionSnapshots[0];
    return {
      fixtureSlug: f.slug,
      leagueName: f.league.name,
      homeTeam: f.homeTeam.name,
      awayTeam: f.awayTeam.name,
      kickoffAt: f.kickoffAt,
      lockedAt: latest.createdAt,
      versions: f.predictionSnapshots.length,
      homeWinProbability: latest.homeWinProbability,
      drawProbability: latest.drawProbability,
      awayWinProbability: latest.awayWinProbability,
      predictedScoreHome: latest.predictedScoreHome,
      predictedScoreAway: latest.predictedScoreAway,
      over25Probability: latest.over25Probability,
      bttsProbability: latest.bttsProbability,
      modelVersion: latest.modelVersion,
      result: f.result,
    };
  });

  return {
    rows,
    truncated,
    recordStartedAt: bounds._min.createdAt,
    lastRecordedAt: bounds._max.createdAt,
    totalSnapshots,
  };
}
