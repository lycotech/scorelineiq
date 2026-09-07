import { prisma } from "@scorelineiq/db";

const fixtureListSelect = {
  id: true,
  slug: true,
  kickoffAt: true,
  status: true,
  league: { select: { name: true, slug: true } },
  homeTeam: { select: { name: true, slug: true } },
  awayTeam: { select: { name: true, slug: true } },
  prediction: {
    select: {
      homeWinProbability: true,
      drawProbability: true,
      awayWinProbability: true,
      predictedScoreHome: true,
      predictedScoreAway: true,
      confidence: true,
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
      league: { select: { name: true, slug: true, country: true } },
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

export async function getAllFixtureSlugsForSitemap() {
  return prisma.fixture.findMany({ select: { slug: true, updatedAt: true, kickoffAt: true } });
}

export async function getAllLeagueSlugsForSitemap() {
  return prisma.league.findMany({ select: { slug: true, updatedAt: true } });
}
