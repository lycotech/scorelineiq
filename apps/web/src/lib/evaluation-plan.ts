// Pure logic for applying a pre-registered evaluation plan. No database
// access, so the rules about which matches count can be unit-tested.

export interface PlanWindow {
  startsAt: Date;
  endsAt: Date;
  targetMatches: number;
}

export interface WindowFixture {
  id: string;
  kickoffAt: Date;
  // True when a pre-kickoff snapshot exists for this fixture.
  hasPrediction: boolean;
}

export type PlanStatus =
  | "not_started" // now is before the period begins
  | "in_progress" // collecting, target not yet reached
  | "complete" // target number of matches reached; the sample is frozen
  | "closed"; // period ended before the target was reached

export interface AppliedPlan<T extends WindowFixture> {
  // The matches that count, in kickoff order, at most targetMatches.
  included: T[];
  // Finished matches inside the counted stretch that had no recorded
  // pre-kickoff prediction. Disclosed publicly: a track record that
  // quietly skips matches it never predicted is not a complete record.
  withoutPrediction: number;
  status: PlanStatus;
}

// `finished` must be fixtures with a final result. Order and window are
// applied here so callers can't accidentally count an extra match.
export function applyPlan<T extends WindowFixture>(plan: PlanWindow, finished: T[], now: Date): AppliedPlan<T> {
  const inWindow = finished
    .filter((f) => f.kickoffAt >= plan.startsAt && f.kickoffAt < plan.endsAt)
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime() || a.id.localeCompare(b.id));

  const included: T[] = [];
  let withoutPrediction = 0;
  for (const f of inWindow) {
    if (included.length >= plan.targetMatches) break; // sample is frozen
    if (f.hasPrediction) included.push(f);
    else withoutPrediction += 1;
  }

  let status: PlanStatus;
  if (included.length >= plan.targetMatches) status = "complete";
  else if (now.getTime() < plan.startsAt.getTime()) status = "not_started";
  else if (now.getTime() >= plan.endsAt.getTime()) status = "closed";
  else status = "in_progress";

  return { included, withoutPrediction, status };
}
