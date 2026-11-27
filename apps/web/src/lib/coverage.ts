// Coverage accounting: for every day, how many matches were played, how
// many had a pre-kickoff prediction, how many were graded. Pure functions
// (no database access) so the rules are unit-testable and the page, the
// audit job and the alerts all use the same definitions.

export type CoverageStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";

export interface CoverageFixture {
  kickoffAt: Date;
  status: CoverageStatus;
  hasSnapshot: boolean;
  hasResult: boolean;
}

export interface ProviderDay {
  day: string; // YYYY-MM-DD (UTC)
  providerFinished: number;
  missingFromDb: number;
  checkedAt: Date;
}

export interface DayCoverage {
  day: string; // YYYY-MM-DD (UTC kickoff date)
  // Matches that should be over by now: not postponed/cancelled and
  // kicked off at least OVER_AFTER_HOURS ago.
  due: number;
  // due matches that had a recorded pre-kickoff prediction.
  predicted: number;
  // due matches with no pre-kickoff prediction (disclosed, never hidden).
  notPredicted: number;
  // predicted matches whose final result is recorded.
  graded: number;
  // due matches with no result yet (any prediction state).
  awaitingResult: number;
  // awaitingResult matches that are more than STALE_AFTER_HOURS past
  // kickoff — these indicate a pipeline fault, not just a slow game.
  staleUngraded: number;
  // Postponed/cancelled matches, not counted in `due`.
  excluded: number;
  // Matches kicking off later than now (not yet due).
  upcoming: number;
  // Provider reconciliation for this day, when the audit has run.
  provider: ProviderDay | null;
}

export interface CoverageTotals {
  due: number;
  predicted: number;
  notPredicted: number;
  graded: number;
  awaitingResult: number;
  staleUngraded: number;
  // predicted / due, null when nothing was due.
  predictedShare: number | null;
}

// Football takes ~2 hours; 3 covers extra time and delays before a match
// is expected to be finished.
export const OVER_AFTER_HOURS = 3;
// The scoring job runs every 2 hours; a result still missing a day after
// kickoff means scoring is failing for that match.
export const STALE_AFTER_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function summarizeCoverage(
  fixtures: CoverageFixture[],
  providerDays: ProviderDay[],
  now: Date,
): DayCoverage[] {
  const days = new Map<string, DayCoverage>();
  const provider = new Map(providerDays.map((p) => [p.day, p]));

  const blank = (day: string): DayCoverage => ({
    day,
    due: 0,
    predicted: 0,
    notPredicted: 0,
    graded: 0,
    awaitingResult: 0,
    staleUngraded: 0,
    excluded: 0,
    upcoming: 0,
    provider: provider.get(day) ?? null,
  });
  const get = (day: string) => {
    let d = days.get(day);
    if (!d) {
      d = blank(day);
      days.set(day, d);
    }
    return d;
  };

  for (const f of fixtures) {
    const d = get(utcDay(f.kickoffAt));
    if (f.status === "POSTPONED" || f.status === "CANCELLED") {
      d.excluded += 1;
      continue;
    }
    const ageHours = (now.getTime() - f.kickoffAt.getTime()) / HOUR_MS;
    if (ageHours < OVER_AFTER_HOURS) {
      d.upcoming += 1;
      continue;
    }
    d.due += 1;
    if (f.hasSnapshot) d.predicted += 1;
    else d.notPredicted += 1;
    if (f.hasResult) {
      if (f.hasSnapshot) d.graded += 1;
    } else {
      d.awaitingResult += 1;
      if (ageHours >= STALE_AFTER_HOURS) d.staleUngraded += 1;
    }
  }

  // A day the provider reported on but we have no fixtures for still
  // belongs in the table: that is the "everything missing" case.
  for (const p of providerDays) get(p.day);

  return [...days.values()].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

export function totalCoverage(days: DayCoverage[]): CoverageTotals {
  const t = days.reduce(
    (acc, d) => ({
      due: acc.due + d.due,
      predicted: acc.predicted + d.predicted,
      notPredicted: acc.notPredicted + d.notPredicted,
      graded: acc.graded + d.graded,
      awaitingResult: acc.awaitingResult + d.awaitingResult,
      staleUngraded: acc.staleUngraded + d.staleUngraded,
    }),
    { due: 0, predicted: 0, notPredicted: 0, graded: 0, awaitingResult: 0, staleUngraded: 0 },
  );
  return { ...t, predictedShare: t.due > 0 ? t.predicted / t.due : null };
}

// Faults the pipeline owner must act on. Matches that merely had no
// prediction are NOT here: a team without synced stats legitimately gets
// "prediction pending". These are things that should never happen.
export function findPipelineProblems(days: DayCoverage[]): string[] {
  const problems: string[] = [];
  for (const d of days) {
    if (d.staleUngraded > 0) {
      problems.push(`${d.day}: ${d.staleUngraded} match(es) more than ${STALE_AFTER_HOURS}h past kickoff with no result recorded`);
    }
    if (d.provider && d.provider.missingFromDb > 0) {
      problems.push(
        `${d.day}: ${d.provider.missingFromDb} of ${d.provider.providerFinished} finished matches listed by the data provider are not in our database`,
      );
    }
  }
  return problems;
}
