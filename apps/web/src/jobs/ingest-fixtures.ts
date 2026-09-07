import { prisma, FixtureStatus } from "@scorelineiq/db";
import { slugify } from "../lib/slugify";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";

const KNOWN_STATUSES: Record<string, FixtureStatus> = {
  SCHEDULED: FixtureStatus.SCHEDULED,
  TIMED: FixtureStatus.SCHEDULED,
  IN_PLAY: FixtureStatus.LIVE,
  PAUSED: FixtureStatus.LIVE,
  FINISHED: FixtureStatus.FINISHED,
  AWARDED: FixtureStatus.FINISHED,
  POSTPONED: FixtureStatus.POSTPONED,
  SUSPENDED: FixtureStatus.CANCELLED,
  CANCELLED: FixtureStatus.CANCELLED,
};

interface FootballDataTeam {
  id: number;
  name: string;
}

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  area: { name: string };
  competition: { id: number; name: string };
  homeTeam: FootballDataTeam | null;
  awayTeam: FootballDataTeam | null;
}

interface FootballDataMatchesResponse {
  matches: FootballDataMatch[];
}

function mapStatus(rawStatus: string, fixtureExternalId: number): FixtureStatus {
  const mapped = KNOWN_STATUSES[rawStatus];
  if (!mapped) {
    console.warn(
      `[ingest-fixtures] unrecognized status "${rawStatus}" for fixture ${fixtureExternalId}, defaulting to SCHEDULED`,
    );
    return FixtureStatus.SCHEDULED;
  }
  return mapped;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchMatches(dateFrom: string, dateTo: string): Promise<FootballDataMatch[]> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is not set");
  }

  const url = `${FOOTBALL_DATA_BASE_URL}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const response = await fetch(url, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(
      `Football-Data.org request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as FootballDataMatchesResponse;
  return data.matches;
}

async function upsertLeague(competition: FootballDataMatch["competition"], country: string) {
  const externalId = String(competition.id);
  return prisma.league.upsert({
    where: { externalId },
    create: {
      externalId,
      name: competition.name,
      slug: slugify(competition.name),
      country,
    },
    update: {
      name: competition.name,
      country,
    },
  });
}

async function upsertTeam(team: FootballDataTeam, leagueId: string) {
  const externalId = String(team.id);
  return prisma.team.upsert({
    where: { externalId },
    create: {
      externalId,
      name: team.name,
      slug: slugify(team.name),
      leagueId,
    },
    update: {
      name: team.name,
      leagueId,
    },
  });
}

async function ingestFixtures(dateFrom: string, dateTo: string) {
  const matches = await fetchMatches(dateFrom, dateTo);

  let upserted = 0;
  let skipped = 0;

  for (const match of matches) {
    if (!match.homeTeam?.name || !match.awayTeam?.name) {
      skipped += 1;
      continue;
    }

    const league = await upsertLeague(match.competition, match.area.name);
    const homeTeam = await upsertTeam(match.homeTeam, league.id);
    const awayTeam = await upsertTeam(match.awayTeam, league.id);
    const status = mapStatus(match.status, match.id);

    await prisma.fixture.upsert({
      where: { externalId: String(match.id) },
      create: {
        externalId: String(match.id),
        slug: `${homeTeam.slug}-vs-${awayTeam.slug}-${formatDate(new Date(match.utcDate))}`,
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt: new Date(match.utcDate),
        status,
      },
      update: {
        kickoffAt: new Date(match.utcDate),
        status,
      },
    });

    upserted += 1;
  }

  return { upserted, skipped, total: matches.length };
}

async function main() {
  const now = new Date();
  const dateFrom = formatDate(now);
  const dateTo = formatDate(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000));

  console.log(`[ingest-fixtures] fetching matches from ${dateFrom} to ${dateTo}`);
  const result = await ingestFixtures(dateFrom, dateTo);
  console.log(
    `[ingest-fixtures] done: ${result.upserted} upserted, ${result.skipped} skipped (no team assigned), ${result.total} total`,
  );
}

main()
  .catch((error) => {
    console.error("[ingest-fixtures] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
