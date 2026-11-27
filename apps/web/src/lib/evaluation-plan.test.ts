import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPlan, type WindowFixture } from "./evaluation-plan";

const d = (s: string) => new Date(`${s}T12:00:00Z`);
const plan = { startsAt: new Date("2027-01-01T00:00:00Z"), endsAt: new Date("2027-02-01T00:00:00Z"), targetMatches: 3 };

function fx(id: string, day: string, hasPrediction = true): WindowFixture {
  return { id, kickoffAt: d(day), hasPrediction };
}

test("matches outside the window never count", () => {
  const r = applyPlan(plan, [fx("a", "2026-12-31"), fx("b", "2027-01-05"), fx("c", "2027-02-01")], d("2027-01-10"));
  assert.deepEqual(r.included.map((f) => f.id), ["b"]);
  assert.equal(r.status, "in_progress");
});

test("sample freezes at the target: later matches are ignored, even if input is unordered", () => {
  const r = applyPlan(
    plan,
    [fx("e", "2027-01-20"), fx("a", "2027-01-02"), fx("d", "2027-01-15"), fx("b", "2027-01-03"), fx("c", "2027-01-04")],
    d("2027-01-25"),
  );
  assert.deepEqual(r.included.map((f) => f.id), ["a", "b", "c"]);
  assert.equal(r.status, "complete");
});

test("unpredicted matches are disclosed, not silently dropped, and don't use up the target", () => {
  const r = applyPlan(
    plan,
    [fx("a", "2027-01-02"), fx("x", "2027-01-03", false), fx("b", "2027-01-04"), fx("c", "2027-01-05")],
    d("2027-01-10"),
  );
  assert.deepEqual(r.included.map((f) => f.id), ["a", "b", "c"]);
  assert.equal(r.withoutPrediction, 1);
});

test("unpredicted matches after the sample froze are not counted against it", () => {
  const r = applyPlan(
    plan,
    [fx("a", "2027-01-02"), fx("b", "2027-01-03"), fx("c", "2027-01-04"), fx("x", "2027-01-05", false)],
    d("2027-01-10"),
  );
  assert.equal(r.withoutPrediction, 0);
});

test("status: not started, closed short of target", () => {
  assert.equal(applyPlan(plan, [], d("2026-12-30")).status, "not_started");
  assert.equal(applyPlan(plan, [fx("a", "2027-01-02")], d("2027-02-02")).status, "closed");
  assert.equal(applyPlan(plan, [fx("a", "2027-01-02")], d("2027-01-02")).status, "in_progress");
});
