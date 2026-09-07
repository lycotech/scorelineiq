// Elo rating maintenance — applied once per fixture, the first time
// score-results learns its final result. This is a separate concern
// from prediction-api's Elo *blend* (which only reads a rating
// snapshot to nudge the Poisson probabilities); this module is the
// one place ratings actually change.

// Matches prediction-api's HOME_ELO_BONUS (app/models/elo.py) — keep
// the two in sync if either changes.
const HOME_ELO_BONUS = 60;

// Standard club-football K-factor: how much one result can move a
// rating. Not adjusted for goal-difference margin yet — a reasonable
// enhancement once there's enough of our own result history to check
// it actually improves calibration rather than just adding noise.
const K_FACTOR = 20;

export interface EloUpdateResult {
  homeElo: number;
  awayElo: number;
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** (-(ratingA - ratingB) / 400));
}

export function updateEloRatings(
  homeElo: number,
  awayElo: number,
  homeScore: number,
  awayScore: number,
): EloUpdateResult {
  const expectedHome = expectedScore(homeElo + HOME_ELO_BONUS, awayElo);
  const expectedAway = 1 - expectedHome;

  const actualHome = homeScore > awayScore ? 1 : homeScore === awayScore ? 0.5 : 0;
  const actualAway = 1 - actualHome;

  return {
    homeElo: homeElo + K_FACTOR * (actualHome - expectedHome),
    awayElo: awayElo + K_FACTOR * (actualAway - expectedAway),
  };
}
