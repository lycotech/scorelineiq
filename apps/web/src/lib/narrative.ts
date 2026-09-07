// Generates the per-match narrative text required by AGENTS.md ("every
// match page must render unique, real content... derived from real
// stored stats, not invented"). Phrasing branches on the actual stat
// values below, so two teams with different season records produce
// genuinely different sentences rather than the same template with
// numbers swapped in.
//
// Uses season-to-date totals (all we have yet) rather than a true
// last-5-matches form string — Football-Data.org's free tier doesn't
// expose that, and we don't yet have enough of our own Result history
// to derive it reliably. Upgradeable once that history accumulates.

interface TeamSeasonStats {
  name: string;
  played: number | null;
  won: number | null;
  draw: number | null;
  lost: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  points: number | null;
}

function hasStats(team: TeamSeasonStats): team is TeamSeasonStats & {
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
} {
  return team.played !== null && team.played > 0;
}

function formSentence(team: TeamSeasonStats): string {
  if (!hasStats(team)) {
    return `${team.name} haven't had a standings update yet this season, so their form isn't reflected here.`;
  }

  const winRate = team.won / team.played;
  const goalDiff = team.goalsFor - team.goalsAgainst;
  const goalsPerGame = (team.goalsFor / team.played).toFixed(1);

  if (winRate >= 0.6) {
    return `${team.name} have been in excellent form, winning ${team.won} of their ${team.played} matches this season and scoring ${goalsPerGame} goals a game.`;
  }
  if (winRate >= 0.4) {
    return `${team.name} have a solid record so far — ${team.won}W ${team.draw}D ${team.lost}L from ${team.played} games, with a goal difference of ${goalDiff >= 0 ? "+" : ""}${goalDiff}.`;
  }
  if (winRate >= 0.2) {
    return `${team.name} have had a mixed season, taking ${team.points} points from ${team.played} matches so far.`;
  }
  return `${team.name} have struggled this season, managing just ${team.won} win${team.won === 1 ? "" : "s"} in ${team.played} matches.`;
}

function comparisonSentence(home: TeamSeasonStats, away: TeamSeasonStats): string | null {
  if (!hasStats(home) || !hasStats(away)) return null;

  const homePpg = home.points / home.played;
  const awayPpg = away.points / away.played;
  const diff = Math.abs(homePpg - awayPpg);

  if (diff < 0.15) {
    return `On points-per-game, the two sides are closely matched, which points to a tight contest.`;
  }

  const stronger = homePpg > awayPpg ? home.name : away.name;
  return `${stronger} have the stronger points-per-game record between the two coming into this match.`;
}

export function generateMatchNarrative(
  home: TeamSeasonStats,
  away: TeamSeasonStats,
): string[] {
  const sentences = [formSentence(home), formSentence(away)];
  const comparison = comparisonSentence(home, away);
  if (comparison) sentences.push(comparison);
  return sentences;
}
