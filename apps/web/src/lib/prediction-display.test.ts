import { test } from "node:test";
import assert from "node:assert/strict";
import {
  derivedConfidence,
  favouriteOutcome,
  leanTier,
  splitPercents,
  topPercent,
  validateManualPrediction,
  type ManualPredictionFields,
} from "./prediction-display";

test("splitPercents always sums to 100 and stays within 1 point of the raw value", () => {
  let seed = 12345;
  const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 0; i < 5000; i++) {
    const a = rand();
    const b = rand() * (1 - a);
    const c = 1 - a - b;
    const out = splitPercents(a, b, c);
    assert.equal(out[0] + out[1] + out[2], 100, `${a},${b},${c} -> ${out}`);
    [a, b, c].forEach((v, k) => assert.ok(Math.abs(out[k] - v * 100) < 1, `${v} -> ${out[k]}`));
  }
});

test("splitPercents fixes the classic 33.4/33.3/33.3 = 99 case", () => {
  // Independent rounding would give 33 + 33 + 33 = 99.
  assert.deepEqual(splitPercents(0.334, 0.333, 0.333), [34, 33, 33]);
});

test("splitPercents does not invent a total: honest if inputs don't sum to 1", () => {
  const out = splitPercents(0.5, 0.3, 0.1);
  assert.equal(out[0] + out[1] + out[2], 90);
});

test("topPercent equals the favourite's displayed bar", () => {
  const p = [0.4546, 0.2727, 0.2727] as const;
  const shown = splitPercents(...p);
  assert.equal(topPercent(...p), Math.max(...shown));
  assert.equal(topPercent(...p), 46);
});

test("leanTier boundaries are shared and inclusive at the lower edge", () => {
  assert.equal(leanTier(0.6), "high");
  assert.equal(leanTier(0.599), "moderate");
  assert.equal(leanTier(0.45), "moderate");
  assert.equal(leanTier(0.449), "close");
});

test("favouriteOutcome", () => {
  assert.equal(favouriteOutcome(0.5, 0.3, 0.2), "1");
  assert.equal(favouriteOutcome(0.2, 0.3, 0.5), "2");
  assert.equal(favouriteOutcome(0.3, 0.4, 0.3), "X");
});

const ok: ManualPredictionFields = {
  homeWinProbability: 0.5,
  drawProbability: 0.3,
  awayWinProbability: 0.2,
  predictedScoreHome: 2,
  predictedScoreAway: 1,
  over25Probability: 0.55,
  bttsProbability: 0.6,
  expectedGoals: 2.7,
};

test("validateManualPrediction accepts a consistent entry", () => {
  assert.deepEqual(validateManualPrediction(ok), []);
  // whole-percent rounding slack
  assert.deepEqual(validateManualPrediction({ ...ok, homeWinProbability: 0.51 }), []);
});

test("validateManualPrediction rejects inconsistent entries", () => {
  assert.ok(validateManualPrediction({ ...ok, awayWinProbability: 0.4 }).some((p) => p.includes("total 100%")));
  assert.ok(validateManualPrediction({ ...ok, over25Probability: 1.2 }).some((p) => p.includes("Over 2.5")));
  assert.ok(validateManualPrediction({ ...ok, predictedScoreHome: -1 }).length > 0);
  assert.ok(validateManualPrediction({ ...ok, predictedScoreAway: 1.5 }).length > 0);
  assert.ok(validateManualPrediction({ ...ok, expectedGoals: NaN }).length > 0);
});

test("derivedConfidence is the favourite's probability to 1 dp", () => {
  assert.equal(derivedConfidence(0.4546, 0.2727, 0.2727), 45.5);
});
