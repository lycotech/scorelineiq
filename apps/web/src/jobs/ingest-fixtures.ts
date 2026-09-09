import { prisma } from "@scorelineiq/db";
import { runJob } from "../lib/job-runner";
import { slugify } from "../lib/slugify";
import {
  fetchMatches,
  formatDate,
  mapStatus,
  type FootballDataMatch,
  type FootballDataTeam,
} from "../lib/football-data";

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
  // Football-Data.org's free tier accepts date ranges at least this
  // wide (tested: a 9-day window returns 200 OK). A narrower window
  // was silently hiding entire leagues whose next fixture happened to
  // fall outside it — Premier League, Bundesliga and Ligue 1 all had
  // zero rows in the database under the old +2-day window despite
  // being fully available from the API.
  const dateTo = formatDate(new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000));

  console.log(`[ingest-fixtures] fetching matches from ${dateFrom} to ${dateTo}`);
  const result = await ingestFixtures(dateFrom, dateTo);
  console.log(
    `[ingest-fixtures] done: ${result.upserted} upserted, ${result.skipped} skipped (no team assigned), ${result.total} total`,
  );
}

runJob("ingest-fixtures", main);
