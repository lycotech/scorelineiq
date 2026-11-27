import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findPipelineProblems,
  summarizeCoverage,
  totalCoverage,
  type CoverageFixture,
  type ProviderDay,
} from "./coverage";

const now = new Date("2027-03-10T12:00:00Z");
const at = (iso: string) => new Date(iso);

function fx(iso: string, over: Partial<CoverageFixture> = {}): CoverageFixture {
  return { kickoffAt: at(iso), status: "FINISHED", hasSnapshot: true, hasResult: true, ...over };
}

test("a predicted and graded match counts in every column it should", () => {
  const [d] = summarizeCoverage([fx("2027-03-09T15:00:00Z")], [], now);
  assert.deepEqual(
    { due: d.due, predicted: d.predicted, graded: d.graded, notPredicted: d.notPredicted, awaiting: d.awaitingResult },
    { due: 1, predicted: 1, graded: 1, notPredicted: 0, awaiting: 0 },
  );
});

test("matches without a pre-kickoff prediction are counted, not hidden, and not graded", () => {
  const [d] = summarizeCoverage([fx("2027-03-09T15:00:00Z", { hasSnapshot: false })], [], now);
  assert.equal(d.due, 1);
  assert.equal(d.notPredicted, 1);
  assert.equal(d.predicted, 0);
  assert.equal(d.graded, 0); // a result without a prediction is not a graded prediction
});

test("postponed/cancelled are excluded; matches still in play or upcoming are not yet due", () => {
  const [d] = summarizeCoverage(
    [
      fx("2027-03-10T01:00:00Z", { status: "POSTPONED", hasResult: false }),
      fx("2027-03-10T02:00:00Z", { status: "CANCELLED", hasResult: false }),
      fx("2027-03-10T10:30:00Z", { status: "LIVE", hasResult: false }), // 1.5h ago
      fx("2027-03-10T20:00:00Z", { status: "SCHEDULED", hasResult: false }), // future
    ],
    [],
    now,
  );
  assert.equal(d.excluded, 2);
  assert.equal(d.upcoming, 2);
  assert.equal(d.due, 0);
});

test("overdue with no result is awaiting; over 24h overdue is stale", () => {
  const days = summarizeCoverage(
    [
      fx("2027-03-10T08:00:00Z", { hasResult: false }), // 4h ago: awaiting, not stale
      fx("2027-03-09T08:00:00Z", { hasResult: false }), // 28h ago: stale
    ],
    [],
    now,
  );
  const byDay = Object.fromEntries(days.map((x) => [x.day, x]));
  assert.equal(byDay["2027-03-10"].awaitingResult, 1);
  assert.equal(byDay["2027-03-10"].staleUngraded, 0);
  assert.equal(byDay["2027-03-09"].staleUngraded, 1);
});

test("days are UTC kickoff days and sorted newest first", () => {
  const days = summarizeCoverage(
    [fx("2027-03-08T23:59:00Z"), fx("2027-03-09T00:01:00Z")],
    [],
    now,
  );
  assert.deepEqual(days.map((d) => d.day), ["2027-03-09", "2027-03-08"]);
});

test("provider reconciliation is attached, and a day with only provider data still appears", () => {
  const p: ProviderDay[] = [
    { day: "2027-03-07", providerFinished: 5, missingFromDb: 5, checkedAt: now },
    { day: "2027-03-09", providerFinished: 2, missingFromDb: 0, checkedAt: now },
  ];
  const days = summarizeCoverage([fx("2027-03-09T15:00:00Z")], p, now);
  assert.deepEqual(days.map((d) => d.day), ["2027-03-09", "2027-03-07"]);
  assert.equal(days[1].due, 0);
  assert.equal(days[1].provider?.missingFromDb, 5);
});

test("totals and predicted share", () => {
  const days = summarizeCoverage(
    [fx("2027-03-09T15:00:00Z"), fx("2027-03-09T16:00:00Z", { hasSnapshot: false }), fx("2027-03-08T15:00:00Z")],
    [],
    now,
  );
  const t = totalCoverage(days);
  assert.equal(t.due, 3);
  assert.equal(t.predicted, 2);
  assert.equal(t.graded, 2);
  assert.equal(t.notPredicted, 1);
  assert.ok(Math.abs((t.predictedShare as number) - 2 / 3) < 1e-9);
  assert.equal(totalCoverage([]).predictedShare, null);
});

test("pipeline problems: stale ungraded and missing-from-DB are flagged; merely unpredicted is not", () => {
  const p: ProviderDay[] = [{ day: "2027-03-08", providerFinished: 4, missingFromDb: 1, checkedAt: now }];
  const days = summarizeCoverage(
    [
      fx("2027-03-09T08:00:00Z", { hasResult: false }), // stale
      fx("2027-03-09T09:00:00Z", { hasSnapshot: false }), // unpredicted only
    ],
    p,
    now,
  );
  const problems = findPipelineProblems(days);
  assert.equal(problems.length, 2);
  assert.ok(problems.some((s) => s.includes("no result recorded")));
  assert.ok(problems.some((s) => s.includes("not in our database")));
  assert.deepEqual(findPipelineProblems(summarizeCoverage([fx("2027-03-09T15:00:00Z", { hasSnapshot: false })], [], now)), []);
});
