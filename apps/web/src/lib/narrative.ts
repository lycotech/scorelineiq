// Generates the per-match narrative text required by AGENTS.md ("every
// match page must render unique, real content... derived from real
// stored stats, not invented"). Phrasing branches on the actual stat
// values below, so two teams/fixtures with different numbers produce
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

// The subset of Prediction actually used here — generateMatchNarrative
// accepts the full Prisma Prediction record (a superset) at the call
// site, this just documents what's read.
export interface MatchPrediction {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  over25Probability: number;
  bttsProbability: number;
  expectedGoals: number | null;
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

function pct(value: number): number {
  return Math.round(value * 100);
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

function formComparisonSentence(home: TeamSeasonStats, away: TeamSeasonStats): string | null {
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

function attackComparisonSentence(home: TeamSeasonStats, away: TeamSeasonStats): string | null {
  if (!hasStats(home) || !hasStats(away)) return null;

  const homePg = home.goalsFor / home.played;
  const awayPg = away.goalsFor / away.played;
  const diff = Math.abs(homePg - awayPg);

  if (diff < 0.2) {
    return `Both sides are scoring at a similar rate this season — ${home.name} on ${homePg.toFixed(1)} goals a game, ${away.name} on ${awayPg.toFixed(1)}.`;
  }

  const better = homePg > awayPg ? home : away;
  const other = better === home ? away : home;
  const betterPg = better === home ? homePg : awayPg;
  const otherPg = other === home ? homePg : awayPg;
  return `${better.name} have the sharper attack of the two, scoring ${betterPg.toFixed(1)} goals a game to ${other.name}'s ${otherPg.toFixed(1)}.`;
}

function defenseComparisonSentence(home: TeamSeasonStats, away: TeamSeasonStats): string | null {
  if (!hasStats(home) || !hasStats(away)) return null;

  const homePg = home.goalsAgainst / home.played;
  const awayPg = away.goalsAgainst / away.played;
  const diff = Math.abs(homePg - awayPg);

  if (diff < 0.2) {
    return `Defensively there's little between them — ${home.name} conceding ${homePg.toFixed(1)} a game, ${away.name} ${awayPg.toFixed(1)}.`;
  }

  const tighter = homePg < awayPg ? home : away;
  const other = tighter === home ? away : home;
  const tighterPg = tighter === home ? homePg : awayPg;
  const otherPg = other === home ? homePg : awayPg;
  return `${tighter.name} have been the tighter side defensively, conceding ${tighterPg.toFixed(1)} a game to ${other.name}'s ${otherPg.toFixed(1)}.`;
}

// Explains the model's 1X2 lean in plain language — distinct from
// formComparisonSentence (season PPG) since this reflects the blended
// Poisson/Elo output, which can disagree with raw season form.
function modelLeanSentence(
  prediction: MatchPrediction,
  home: TeamSeasonStats,
  away: TeamSeasonStats,
): string {
  const { homeWinProbability: h, drawProbability: d, awayWinProbability: a } = prediction;
  const max = Math.max(h, d, a);

  if (max === h) {
    if (h >= 0.6) {
      return `The model leans heavily toward a ${home.name} win, giving it a ${pct(h)}% chance — the clearest signal of the three possible outcomes.`;
    }
    if (h >= 0.45) {
      return `${home.name} are the model's favourite at ${pct(h)}%, though a draw or ${away.name} win remain live possibilities.`;
    }
    return `${home.name} are rated the most likely outcome at just ${pct(h)}%, in what the model sees as a genuinely open match.`;
  }

  if (max === a) {
    if (a >= 0.6) {
      return `The model leans heavily toward a ${away.name} win, giving it a ${pct(a)}% chance — the clearest signal of the three possible outcomes.`;
    }
    if (a >= 0.45) {
      return `${away.name} are the model's favourite at ${pct(a)}%, though a draw or ${home.name} win remain live possibilities.`;
    }
    return `${away.name} are rated the most likely outcome at just ${pct(a)}%, in what the model sees as a genuinely open match.`;
  }

  if (d >= 0.35) {
    return `This is one of the model's more draw-leaning fixtures, with a stalemate given a ${pct(d)}% chance.`;
  }
  return `No single outcome stands out strongly — the draw edges it at ${pct(d)}%, just ahead of both match-winner options.`;
}

function goalsOutlookSentence(prediction: MatchPrediction): string {
  const { over25Probability: o25, bttsProbability: btts, expectedGoals } = prediction;
  const egText = expectedGoals !== null ? ` with an expected total of ${expectedGoals.toFixed(1)} goals` : "";

  if (o25 >= 0.65) {
    return `Goals look likely here — over 2.5 is rated at ${pct(o25)}%${egText}.`;
  }
  if (o25 <= 0.35) {
    return `This is shaping up as a tighter, lower-scoring game — under 2.5 goals is favoured at ${pct(1 - o25)}%${egText}.`;
  }

  const bttsText =
    btts >= 0.55
      ? `both teams are given a good chance of scoring (${pct(btts)}%)`
      : btts <= 0.45
        ? `at least one side is given a real chance of being kept out (BTTS at just ${pct(btts)}%)`
        : `both-teams-to-score sits close to a coin flip at ${pct(btts)}%`;
  return `It's a closer call on goals overall — over 2.5 is at ${pct(o25)}%, and ${bttsText}.`;
}

export function generateMatchNarrative(
  home: TeamSeasonStats,
  away: TeamSeasonStats,
  prediction?: MatchPrediction | null,
): string[] {
  const sentences = [formSentence(home), formSentence(away)];

  const formComparison = formComparisonSentence(home, away);
  if (formComparison) sentences.push(formComparison);

  const attack = attackComparisonSentence(home, away);
  if (attack) sentences.push(attack);

  const defense = defenseComparisonSentence(home, away);
  if (defense) sentences.push(defense);

  if (prediction) {
    sentences.push(modelLeanSentence(prediction, home, away));
    sentences.push(goalsOutlookSentence(prediction));
  }

  return sentences;
}
