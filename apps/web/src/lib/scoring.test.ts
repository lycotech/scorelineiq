import { test } from "node:test";
import assert from "node:assert/strict";
import {
  brier1x2,
  brierBinary,
  buildProbabilityReport,
  calibrationBins,
  MIN_SAMPLE,
  type EvalRow,
} from "./scoring";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test("brier1x2: perfect, worst and uniform forecasts", () => {
  close(brier1x2(1, 0, 0, 2, 1), 0);
  close(brier1x2(0, 0, 1, 2, 1), 2);
  close(brier1x2(1 / 3, 1 / 3, 1 / 3, 0, 0), 2 / 3);
  // 0.5/0.3/0.2 and a home win: 0.25 + 0.09 + 0.04
  close(brier1x2(0.5, 0.3, 0.2, 1, 0), 0.38);
});

test("brierBinary", () => {
  close(brierBinary(0.7, true), 0.09);
  close(brierBinary(0.7, false), 0.49);
});

test("calibrationBins: p=1 lands in the last bin and ECE is weighted", () => {
  const c = calibrationBins([
    { p: 1, hit: true },
    { p: 0.95, hit: false },
    { p: 0.05, hit: false },
  ]);
  assert.equal(c.bins.length, 10);
  assert.equal(c.bins[9].n, 2);
  close(c.bins[9].meanPredicted as number, 0.975);
  close(c.bins[9].observedRate as number, 0.5);
  assert.equal(c.bins[0].n, 1);
  assert.equal(c.bins[5].n, 0);
  assert.equal(c.bins[5].meanPredicted, null);
  // (2/3)*|0.975-0.5| + (1/3)*|0.05-0|
  close(c.expectedCalibrationError as number, (2 / 3) * 0.475 + (1 / 3) * 0.05);
});

test("calibrationBins: empty input", () => {
  assert.equal(calibrationBins([]).expectedCalibrationError, null);
});

function row(pH: number, pD: number, pA: number, hs: number, as: number, over = 0.5, btts = 0.5): EvalRow {
  return { pHome: pH, pDraw: pD, pAway: pA, pOver25: over, pBtts: btts, homeScore: hs, awayScore: as };
}

test("report is withheld below the minimum sample", () => {
  const rows = Array.from({ length: MIN_SAMPLE - 1 }, () => row(0.5, 0.3, 0.2, 1, 0));
  assert.equal(buildProbabilityReport(rows), null);
});

test("report: uniform forecaster equals the equal-odds baseline (skill vs equal odds is zero)", () => {
  const outcomes: [number, number][] = [
    [1, 0],
    [0, 0],
    [0, 2],
  ];
  const rows = Array.from({ length: 60 }, (_, i) => {
    const [h, a] = outcomes[i % 3];
    return row(1 / 3, 1 / 3, 1 / 3, h, a);
  });
  const report = buildProbabilityReport(rows)!;
  assert.equal(report.n, 60);
  close(report.oneXTwo.brier, 2 / 3);
  const equal = report.oneXTwo.baselines.find((b) => b.label.startsWith("Equal"))!;
  close(equal.brier, 2 / 3);
  // Outcomes are exactly 1/3 each, so climatology == uniform and skill is 0.
  close(report.oneXTwo.skillVsClimatology as number, 0);
});

test("report: confident correct forecaster beats the base rate", () => {
  const rows: EvalRow[] = [];
  for (let i = 0; i < 40; i++) {
    rows.push(row(0.9, 0.05, 0.05, 2, 0, 0.9, 0.1)); // home win, 2 goals, no BTTS
    rows.push(row(0.05, 0.05, 0.9, 0, 1, 0.1, 0.1)); // away win, 1 goal
  }
  const report = buildProbabilityReport(rows)!;
  assert.ok((report.oneXTwo.skillVsClimatology as number) > 0.9);
  assert.ok(report.oneXTwo.brier < report.oneXTwo.baselines[0].brier);
  // 1X2 calibration pools 3 probabilities per match.
  const pooled = report.calibration.oneXTwo.bins.reduce((s, b) => s + b.n, 0);
  assert.equal(pooled, rows.length * 3);
});

test("report: unscorable rows (NaN / out-of-range) are excluded, not counted", () => {
  const good = Array.from({ length: MIN_SAMPLE }, () => row(0.5, 0.3, 0.2, 1, 0));
  const bad = [row(NaN, 0.3, 0.2, 1, 0), row(1.5, 0, 0, 1, 0)];
  assert.equal(buildProbabilityReport([...good, ...bad])!.n, MIN_SAMPLE);
});
