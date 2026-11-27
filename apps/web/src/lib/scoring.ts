// Probability-quality scoring: Brier score, calibration and baselines.
//
// Pure functions over already-fetched rows — no database access — so the
// maths can be unit-tested and the page can never show a number that
// isn't derived from stored pre-kickoff predictions and real results.

export interface EvalRow {
  pHome: number;
  pDraw: number;
  pAway: number;
  pOver25: number;
  pBtts: number;
  homeScore: number;
  awayScore: number;
}

export interface MarketScore {
  n: number;
  // Mean Brier score of the model. Lower is better.
  brier: number;
  // Same metric for simple reference forecasts on the SAME matches.
  baselines: { label: string; brier: number }[];
  // 1 - model/climatology. > 0 means better than the base-rate forecast,
  // 0 equal, < 0 worse. null when the baseline is perfect (undefined ratio).
  skillVsClimatology: number | null;
}

export interface CalibrationBin {
  lower: number;
  upper: number;
  n: number;
  meanPredicted: number | null;
  observedRate: number | null;
}

export interface Calibration {
  bins: CalibrationBin[];
  // Count-weighted mean |predicted - observed| across bins. Lower is better.
  expectedCalibrationError: number | null;
}

export interface ProbabilityReport {
  n: number;
  oneXTwo: MarketScore;
  over25: MarketScore;
  btts: MarketScore;
  calibration: { oneXTwo: Calibration; over25: Calibration; btts: Calibration };
}

// Below this many scored matches we publish nothing: a handful of games
// says nothing about probability quality.
export const MIN_SAMPLE = 30;
// Below this we publish, but flag the sample as small.
export const CREDIBLE_SAMPLE = 300;

const BIN_COUNT = 10;

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function isFiniteProbability(p: number): boolean {
  return Number.isFinite(p) && p >= 0 && p <= 1;
}

export function isScorable(r: EvalRow): boolean {
  return (
    isFiniteProbability(r.pHome) &&
    isFiniteProbability(r.pDraw) &&
    isFiniteProbability(r.pAway) &&
    isFiniteProbability(r.pOver25) &&
    isFiniteProbability(r.pBtts) &&
    Number.isInteger(r.homeScore) &&
    Number.isInteger(r.awayScore)
  );
}

// Multi-class Brier for one match: sum over the three outcomes of
// (forecast - outcome)^2. Range 0 (perfect) to 2 (worst).
export function brier1x2(pHome: number, pDraw: number, pAway: number, homeScore: number, awayScore: number): number {
  const oHome = homeScore > awayScore ? 1 : 0;
  const oDraw = homeScore === awayScore ? 1 : 0;
  const oAway = homeScore < awayScore ? 1 : 0;
  return (pHome - oHome) ** 2 + (pDraw - oDraw) ** 2 + (pAway - oAway) ** 2;
}

export function brierBinary(p: number, outcome: boolean): number {
  return (p - (outcome ? 1 : 0)) ** 2;
}

function skill(model: number, reference: number): number | null {
  return reference === 0 ? null : 1 - model / reference;
}

export function calibrationBins(pairs: { p: number; hit: boolean }[]): Calibration {
  const buckets = Array.from({ length: BIN_COUNT }, () => ({ sumP: 0, hits: 0, n: 0 }));
  for (const { p, hit } of pairs) {
    // p === 1 belongs in the last bin, not a nonexistent 11th.
    const idx = Math.min(BIN_COUNT - 1, Math.floor(p * BIN_COUNT));
    buckets[idx].sumP += p;
    buckets[idx].hits += hit ? 1 : 0;
    buckets[idx].n += 1;
  }

  const bins: CalibrationBin[] = buckets.map((b, i) => ({
    lower: i / BIN_COUNT,
    upper: (i + 1) / BIN_COUNT,
    n: b.n,
    meanPredicted: b.n > 0 ? b.sumP / b.n : null,
    observedRate: b.n > 0 ? b.hits / b.n : null,
  }));

  const total = pairs.length;
  const ece =
    total === 0
      ? null
      : bins.reduce(
          (acc, b) =>
            b.n > 0 ? acc + (b.n / total) * Math.abs((b.meanPredicted as number) - (b.observedRate as number)) : acc,
          0,
        );

  return { bins, expectedCalibrationError: ece };
}

function binaryMarket(probabilities: number[], outcomes: boolean[]): MarketScore {
  const n = probabilities.length;
  const model = mean(probabilities.map((p, i) => brierBinary(p, outcomes[i])));

  // Climatology: always forecast the observed base rate of this market in
  // this same sample. It is computed in-sample, which flatters the
  // baseline slightly — i.e. it is a deliberately demanding comparison.
  const baseRate = outcomes.filter(Boolean).length / n;
  const climatology = mean(outcomes.map((o) => brierBinary(baseRate, o)));
  const coinFlip = mean(outcomes.map((o) => brierBinary(0.5, o)));

  return {
    n,
    brier: model,
    baselines: [
      { label: "Base rate (always forecast the average)", brier: climatology },
      { label: "Coin flip (always 50%)", brier: coinFlip },
    ],
    skillVsClimatology: skill(model, climatology),
  };
}

// Returns null when there are fewer than MIN_SAMPLE scorable matches.
export function buildProbabilityReport(allRows: EvalRow[]): ProbabilityReport | null {
  const rows = allRows.filter(isScorable);
  const n = rows.length;
  if (n < MIN_SAMPLE) return null;

  const model1x2 = mean(rows.map((r) => brier1x2(r.pHome, r.pDraw, r.pAway, r.homeScore, r.awayScore)));

  const freqHome = rows.filter((r) => r.homeScore > r.awayScore).length / n;
  const freqDraw = rows.filter((r) => r.homeScore === r.awayScore).length / n;
  const freqAway = rows.filter((r) => r.homeScore < r.awayScore).length / n;
  const climatology1x2 = mean(rows.map((r) => brier1x2(freqHome, freqDraw, freqAway, r.homeScore, r.awayScore)));
  const uniform1x2 = mean(rows.map((r) => brier1x2(1 / 3, 1 / 3, 1 / 3, r.homeScore, r.awayScore)));

  const oneXTwo: MarketScore = {
    n,
    brier: model1x2,
    baselines: [
      { label: "Base rate (always forecast league-wide home/draw/away shares)", brier: climatology1x2 },
      { label: "Equal odds (always 1/3 each)", brier: uniform1x2 },
    ],
    skillVsClimatology: skill(model1x2, climatology1x2),
  };

  const over = rows.map((r) => r.homeScore + r.awayScore > 2.5);
  const btts = rows.map((r) => r.homeScore > 0 && r.awayScore > 0);

  // 1X2 calibration pools all three outcome probabilities (one-vs-rest).
  const pairs1x2 = rows.flatMap((r) => [
    { p: r.pHome, hit: r.homeScore > r.awayScore },
    { p: r.pDraw, hit: r.homeScore === r.awayScore },
    { p: r.pAway, hit: r.homeScore < r.awayScore },
  ]);

  return {
    n,
    oneXTwo,
    over25: binaryMarket(
      rows.map((r) => r.pOver25),
      over,
    ),
    btts: binaryMarket(
      rows.map((r) => r.pBtts),
      btts,
    ),
    calibration: {
      oneXTwo: calibrationBins(pairs1x2),
      over25: calibrationBins(rows.map((r, i) => ({ p: r.pOver25, hit: over[i] }))),
      btts: calibrationBins(rows.map((r, i) => ({ p: r.pBtts, hit: btts[i] }))),
    },
  };
}
