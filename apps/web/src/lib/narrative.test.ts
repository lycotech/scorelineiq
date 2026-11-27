import { test } from "node:test";
import assert from "node:assert/strict";
import { generateMatchNarrative, type MatchPrediction } from "./narrative";
import { splitPercents } from "./prediction-display";

const team = (name: string) => ({
  name,
  played: 20,
  won: 10,
  draw: 5,
  lost: 5,
  goalsFor: 30,
  goalsAgainst: 20,
  points: 35,
});

function narrate(p: Partial<MatchPrediction>): string[] {
  const full: MatchPrediction = {
    homeWinProbability: 0.5,
    drawProbability: 0.3,
    awayWinProbability: 0.2,
    over25Probability: 0.5,
    bttsProbability: 0.5,
    expectedGoals: 2.6,
    ...p,
  };
  return generateMatchNarrative(team("Hometown"), team("Awayville"), full);
}

test("high-scoring match with low BTTS does not claim both teams will score", () => {
  const text = narrate({ over25Probability: 0.72, bttsProbability: 0.4 }).join(" ");
  assert.ok(!text.includes("Both teams are expected to contribute"));
  assert.ok(text.includes("one side could be kept out (BTTS: only 40%)"));
});

test("low-scoring match with high BTTS does not claim a side is kept off the scoresheet", () => {
  const text = narrate({ over25Probability: 0.3, bttsProbability: 0.62 }).join(" ");
  assert.ok(!text.includes("kept off the scoresheet"));
  assert.ok(text.includes("both teams look likely to score (BTTS: 62%)"));
});

test("the 1X2 percentage quoted in the sentence matches the displayed (sum-to-100) rounding", () => {
  // 40.6 / 29.7 / 29.7: independent rounding shows 41 + 30 + 30 = 101, so
  // the displayed split gives the favourite 40. The sentence must say 40.
  const p = { homeWinProbability: 0.406, drawProbability: 0.297, awayWinProbability: 0.297 };
  assert.deepEqual(splitPercents(p.homeWinProbability, p.drawProbability, p.awayWinProbability), [40, 30, 30]);
  const lean = narrate(p).find((s) => s.includes("Hometown are rated"))!;
  assert.ok(lean.includes("40%") && !lean.includes("41%"), lean);
});

test("lean wording uses the same cut-offs as the table badge (0.60 high, 0.45 moderate)", () => {
  assert.ok(narrate({ homeWinProbability: 0.6, drawProbability: 0.25, awayWinProbability: 0.15 })
    .some((s) => s.includes("leans heavily toward a Hometown win")));
  assert.ok(narrate({ homeWinProbability: 0.59, drawProbability: 0.26, awayWinProbability: 0.15 })
    .some((s) => s.includes("Hometown are the model's favourite")));
  assert.ok(narrate({ homeWinProbability: 0.45, drawProbability: 0.3, awayWinProbability: 0.25 })
    .some((s) => s.includes("Hometown are the model's favourite")));
  assert.ok(narrate({ homeWinProbability: 0.44, drawProbability: 0.3, awayWinProbability: 0.26 })
    .some((s) => s.includes("genuinely open")));
});
