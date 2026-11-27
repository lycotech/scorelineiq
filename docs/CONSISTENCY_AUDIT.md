# Consistency audit — predicted score, favourite and goals figures

Goal: the figures shown for one match (1X2 split, favourite/confidence, most
likely score, expected goals, Over/Under 2.5, BTTS, narrative text) must read
consistently, and every apparent contradiction must be either fixed or shown
to be expected behaviour and explained on the page.

Method: the real model code was run over a grid of plausible inputs
(`apps/prediction-api/scripts/consistency_audit.py`: 1,875 fixtures; league
averages 1.2–1.6, team rates 0.7–2.2) and over 20,000 random fixtures
(`consistency_audit_rounding.py`), counting how often the published figures
disagree. Both scripts are re-runnable after any model or display change.

## Defects found and fixed

| # | Defect | Evidence | Fix |
|---|---|---|---|
| F | **Expected goals inflated by 17.5% for every fixture.** `league_avg_goals` is goals per *team* per game, but the home boost (×1.35) was applied to the home side only, so the two sides' mean sat 17.5% above the league average. Two average teams in a 1.4-goal league produced 3.29 total goals (league reality 2.80) and Over 2.5 of 64% (league-average Poisson: 53%). | Exact arithmetic, identical in every league. | `expected_goals` now splits the home advantage so the ratio stays 1.35 but home + away = 2 × league average. After: model total = league total, O2.5 53% vs 53%. **Model version bumped to `poisson-dixon-coles-elo-v2`.** |
| J | Home/Draw/Away percentages did not sum to 100 on screen (e.g. 33/33/33, or 41/30/30 = 101). | 25% of fixtures. | `splitPercents` (largest remainder) used by the fixture table, match page, share image, history page and narrative. |
| G2 | "Confidence" card differed from the favourite's own bar by 1 point: the model rounds confidence to 1 decimal and the page rounded it again. | 5% of fixtures. | Confidence shown is the favourite's displayed percentage (`topPercent`). Home-page "top pick" uses the same number. |
| G3 | Narrative and table used different cut-offs: a 62% favourite was "leans heavily" in the text but "Moderate confidence" in the table; 47% was "the model's favourite" in the text but "Close match" in the table. | ~58% of non-draw favourites got mismatched wording (pre-fix thresholds 0.60/0.45 vs 70/50). | One shared pair of cut-offs (`HIGH_LEAN` 0.60, `MODERATE_LEAN` 0.45) used by both. |
| H | Narrative said "Both teams are expected to contribute to the scoring" for any Over-2.5 ≥ 65% fixture, even with BTTS under 50% (lopsided 3-0 type games). | 6% of those fixtures. | The BTTS clause is now chosen from the BTTS figure itself. |
| — | `how-it-works` described Confidence as a "composite 0–100 score". It is simply the favourite's probability. | By inspection. | Copy corrected. |
| — | Manual admin predictions were saved with no checks: 1X2 not summing to 100, out-of-range values, and a free-text "confidence" unrelated to the probabilities. | By inspection. | Entries are validated (1X2 total 100% ± 1.5, ranges, whole-number scores); confidence is derived from the 1X2 numbers and the field removed. |

## Not defects — expected behaviour, now explained on the page

These come from comparing a *mode* (a single most likely value) with a *mean*
or a different market. They are real features of the maths, not errors.

| Observation (post-fix grid) | Why |
|---|---|
| Most likely score is a draw while a side is favourite: 41% of fixtures (16.5% of ≥50% favourites; 1.6% of ≥60% favourites). | A draw is one scoreline (1-1) competing against many individual winning scorelines; the single most probable *cell* can be 1-1 even when "a home win" is the most probable *result*. |
| "Over 2.5" shown but most likely score has ≤2 goals: 28.5%. Expected goals differs from the score's goals by ≥1 in 58%. | Expected goals is the mean over all scorelines; the most likely score is the mode of a right-skewed distribution, so the mean is usually higher. |
| BTTS ≥50% with a clean sheet in the likely score (7.6%) and the reverse (8.3%). | Same mode-vs-probability reason. |

The match page, the fixture table headers/tooltips, and `how-it-works` now
say: *Most likely score* = single most probable scoreline; *Expected goals* =
average across all scorelines; *Confidence* = probability of the most likely
result.

## Disclosed, not changed — decisions for the owner

1. **Score/goals/O-U/BTTS come from the goal model alone; only the 1X2 split is
   Elo-adjusted.** With Elo ratings uncorrelated with goal stats (promotion,
   injuries) the Elo blend flips the 1X2 favourite vs pure Poisson in ~7% of
   fixtures; the score and goals are not adjusted to follow. With correlated
   Elo it is under 1%. Now disclosed on the match page and `how-it-works`.
   *Option:* derive score/goals from the blended 1X2.
2. **Most likely score is the unconditional mode.** *Option:* choose the most
   likely scoreline *consistent with the favourite* so the score always agrees
   with the headline result. This reads more naturally but lowers the
   correct-score hit rate by construction (the unconditional mode maximises
   it) and changes what that accuracy market means. Left as is.

Either option changes model output and should ship as a new model version.

## Caveat

Defect F is established by the model's own definitions (arithmetic), not by
backtesting against results; the repository has no result history to test it
against yet. The scored record (Brier score vs baselines) will show whether
the fix helps once matches accumulate. Predictions made under v1 and v2 are not
directly comparable — see `modelVersion` on every snapshot.
