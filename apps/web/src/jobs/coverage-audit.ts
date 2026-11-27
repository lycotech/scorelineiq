// Daily coverage audit. Does two things:
//
// 1. Reconciles the last LOOKBACK_DAYS of FINISHED matches reported by the
//    data provider against our database, and records per-day counts in
//    CoverageDay (one row per day, upserted — safe to re-run). This is the
//    only way to see matches we never ingested, which no database query
//    can show. A row for every day is also the evidence the audit ran.
// 2. Fails loudly (non-zero exit + Sentry via runJob) if the pipeline has
//    a fault: a match with no result >24h after kickoff, or a finished
//    match the provider lists that we don't have. Matches that merely
//    have no prediction are logged but not treated as faults — a team
//    with no synced stats legitimately shows "prediction pending".
import { prisma } from "@scorelineiq/db";
import { runJob } from "../lib/job-runner";
import { fetchMatches, formatDate } from "../lib/football-data";
import { findPipelineProblems, summarizeCoverage, totalCoverage, utcDay } from "../lib/coverage";

const DAY_MS = 24 * 60 * 60 * 1000;
// Provider window = LOOKBACK_DAYS back + 1 day forward = 9 days, the same
// span ingest-fixtures already requests successfully.
const LOOKBACK_DAYS = 7;

const FINISHED_STATUSES = new Set(["FINISHED", "AWARDED"]);

function dayStart(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

async function reconcileWithProvider(now: Date) {
  const dateFrom = formatDate(new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS));
  const dateTo = formatDate(new Date(now.getTime() + DAY_MS));
  const matches = await fetchMatches(dateFrom, dateTo);

  const today = utcDay(now);
  const finishedByDay = new Map<string, string[]>();
  // Every day in the window gets a row, even with zero matches.
  for (let i = LOOKBACK_DAYS; i >= 1; i--) {
    finishedByDay.set(utcDay(new Date(now.getTime() - i * DAY_MS)), []);
  }
  for (const m of matches) {
    if (!FINISHED_STATUSES.has(m.status)) continue;
    const day = utcDay(new Date(m.utcDate));
    if (day >= today) continue; // today's matches are still being played
    finishedByDay.get(day)?.push(String(m.id));
  }

  const allIds = [...finishedByDay.values()].flat();
  const known = new Set(
    (await prisma.fixture.findMany({ where: { externalId: { in: allIds } }, select: { externalId: true } })).map(
      (f) => f.externalId,
    ),
  );

  for (const [day, ids] of finishedByDay) {
    const data = {
      providerFinished: ids.length,
      missingFromDb: ids.filter((id) => !known.has(id)).length,
      checkedAt: now,
    };
    await prisma.coverageDay.upsert({
      where: { day: dayStart(day) },
      create: { day: dayStart(day), ...data },
      update: data,
    });
  }
  return finishedByDay.size;
}

async function main() {
  const now = new Date();
  console.log("[coverage-audit] reconciling with data provider");
  const daysChecked = await reconcileWithProvider(now);

  const from = dayStart(utcDay(new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS)));
  const [fixtures, providerRows] = await Promise.all([
    prisma.fixture.findMany({
      where: { kickoffAt: { gte: from } },
      select: {
        kickoffAt: true,
        status: true,
        result: { select: { id: true } },
        predictionSnapshots: { take: 1, select: { id: true } },
      },
    }),
    prisma.coverageDay.findMany({ where: { day: { gte: from } } }),
  ]);

  const days = summarizeCoverage(
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
    now,
  );
  const totals = totalCoverage(days);

  console.log(
    `[coverage-audit] last ${LOOKBACK_DAYS} days (${daysChecked} days checked): ${totals.due} matches due, ` +
      `${totals.predicted} predicted before kickoff, ${totals.notPredicted} not predicted, ` +
      `${totals.graded} graded, ${totals.awaitingResult} awaiting result (${totals.staleUngraded} stale)`,
  );
  if (totals.notPredicted > 0) {
    console.warn(`[coverage-audit] ${totals.notPredicted} match(es) had no pre-kickoff prediction (disclosed on /history)`);
  }

  const problems = findPipelineProblems(days);
  if (problems.length > 0) {
    // Thrown so runJob reports to Sentry and sets a non-zero exit code.
    throw new Error(`Coverage problems:\n - ${problems.join("\n - ")}`);
  }
}

runJob("coverage-audit", main);
