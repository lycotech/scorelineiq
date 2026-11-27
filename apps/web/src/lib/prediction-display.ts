// Single source of truth for how prediction numbers are rounded, labelled
// and validated, so every page, the narrative text and the admin tool
// show the same figure for the same quantity.

// Rounds the home/draw/away probabilities to whole percentages that sum
// to exactly 100 (largest-remainder method). Rounding each independently
// leaves 99% or 101% on screen for about a quarter of fixtures.
export function splitPercents(home: number, draw: number, away: number): [number, number, number] {
  const raw = [home * 100, draw * 100, away * 100];
  const target = Math.round(raw[0] + raw[1] + raw[2]);
  const floors = raw.map((v) => Math.floor(v));
  let remaining = target - floors[0] - floors[1] - floors[2];

  const order = [0, 1, 2].sort((a, b) => raw[b] - floors[b] - (raw[a] - floors[a]) || a - b);
  const result = [...floors];
  for (const i of order) {
    if (remaining <= 0) break;
    result[i] += 1;
    remaining -= 1;
  }
  return [result[0], result[1], result[2]];
}

// The favourite's displayed percentage — always the same number as its
// bar, unlike the stored `confidence` column (rounded to 1 decimal in
// the model and then again for display, which differed by 1 point).
export function topPercent(home: number, draw: number, away: number): number {
  return Math.max(...splitPercents(home, draw, away));
}

// One set of cut-offs used by BOTH the fixture table badge and the
// narrative sentence, so the same match is never "moderate confidence"
// in one place and "heavily favoured" in the other.
export const HIGH_LEAN = 0.6;
export const MODERATE_LEAN = 0.45;

export type LeanTier = "high" | "moderate" | "close";

export function leanTier(topProbability: number): LeanTier {
  if (topProbability >= HIGH_LEAN) return "high";
  if (topProbability >= MODERATE_LEAN) return "moderate";
  return "close";
}

export const LEAN_TIER_LABEL: Record<LeanTier, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  close: "Close match",
};

export type Outcome = "1" | "X" | "2";

export function favouriteOutcome(home: number, draw: number, away: number): Outcome {
  const max = Math.max(home, draw, away);
  if (max === home) return "1";
  if (max === draw) return "X";
  return "2";
}

// --- Manual (admin) predictions ------------------------------------------

export interface ManualPredictionFields {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedScoreHome: number;
  predictedScoreAway: number;
  over25Probability: number;
  bttsProbability: number;
  expectedGoals: number;
}

// Admin enters whole percentages, so allow a point and a half of slack
// on the 1X2 total.
const SUM_TOLERANCE = 0.015;

// Returns a list of problems; empty means the entry is internally
// consistent enough to publish.
export function validateManualPrediction(p: ManualPredictionFields): string[] {
  const problems: string[] = [];
  const probs: [string, number][] = [
    ["Home win", p.homeWinProbability],
    ["Draw", p.drawProbability],
    ["Away win", p.awayWinProbability],
    ["Over 2.5", p.over25Probability],
    ["BTTS", p.bttsProbability],
  ];
  for (const [label, value] of probs) {
    if (!Number.isFinite(value) || value < 0 || value > 1) problems.push(`${label} must be between 0% and 100%`);
  }

  const sum = p.homeWinProbability + p.drawProbability + p.awayWinProbability;
  if (Math.abs(sum - 1) > SUM_TOLERANCE) {
    problems.push(`Home + draw + away must total 100% (currently ${(sum * 100).toFixed(1)}%)`);
  }

  for (const [label, value] of [
    ["Predicted home score", p.predictedScoreHome],
    ["Predicted away score", p.predictedScoreAway],
  ] as const) {
    if (!Number.isInteger(value) || value < 0 || value > 20) problems.push(`${label} must be a whole number from 0 to 20`);
  }

  if (!Number.isFinite(p.expectedGoals) || p.expectedGoals < 0 || p.expectedGoals > 15) {
    problems.push("Expected goals must be between 0 and 15");
  }

  return problems;
}

// Confidence is not a free-text field: it is the favourite's probability,
// derived so it can never disagree with the 1X2 numbers.
export function derivedConfidence(home: number, draw: number, away: number): number {
  return Math.round(Math.max(home, draw, away) * 1000) / 10;
}
