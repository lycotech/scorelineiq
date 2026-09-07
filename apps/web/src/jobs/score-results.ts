import { prisma, FixtureStatus, ResultOutcome } from "@scorelineiq/db";
import { fetchMatches, formatDate, mapStatus } from "../lib/football-data";
import { runJob } from "../lib/job-runner";

function computeOutcome(homeScore: number, awayScore: number): ResultOutcome {
  if (homeScore > awayScore) return ResultOutcome.HOME_WIN;
  if (homeScore < awayScore) return ResultOutcome.AWAY_WIN;
  return ResultOutcome.DRAW;
}

async function scoreResults(dateFrom: string, dateTo: string) {
  const matches = await fetchMatches(dateFrom, dateTo);

  let recorded = 0;
  let skippedNotFinished = 0;
  let skippedUnknownFixture = 0;
  let skippedNoScore = 0;

  for (const match of matches) {
    const status = mapStatus(match.status, match.id);
    if (status !== FixtureStatus.FINISHED) {
      skippedNotFinished += 1;
      continue;
    }

    const { home, away } = match.score.fullTime;
    if (home === null || away === null) {
      skippedNoScore += 1;
      continue;
    }

    const fixture = await prisma.fixture.findUnique({
      where: { externalId: String(match.id) },
      select: { id: true },
    });

    if (!fixture) {
      // Never ingested by ingest-fixtures (outside its pull window) —
      // scoring a fixture we don't have would mean fabricating it.
      skippedUnknownFixture += 1;
      continue;
    }

    const outcome = computeOutcome(home, away);

    await prisma.$transaction([
      prisma.fixture.update({
        where: { id: fixture.id },
        data: { status: FixtureStatus.FINISHED },
      }),
      prisma.result.upsert({
        where: { fixtureId: fixture.id },
        create: {
          fixtureId: fixture.id,
          homeScore: home,
          awayScore: away,
          outcome,
        },
        update: {
          homeScore: home,
          awayScore: away,
          outcome,
        },
      }),
    ]);

    recorded += 1;
  }

  return {
    recorded,
    skippedNotFinished,
    skippedUnknownFixture,
    skippedNoScore,
    total: matches.length,
  };
}

async function main() {
  const now = new Date();
  const dateFrom = formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000));
  // Football-Data.org's dateTo appears to exclude same-day matches near
  // the UTC day boundary (confirmed empirically: a dateTo of "today"
  // silently dropped an in-progress match kicked off earlier today) —
  // padding by a day ensures today's fixtures are actually included.
  const dateTo = formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  console.log(`[score-results] fetching matches from ${dateFrom} to ${dateTo}`);
  const result = await scoreResults(dateFrom, dateTo);
  console.log(
    `[score-results] done: ${result.recorded} recorded, ${result.skippedNotFinished} not finished, ` +
      `${result.skippedUnknownFixture} unknown fixture, ${result.skippedNoScore} no score, ${result.total} total`,
  );
}

runJob("score-results", main);
