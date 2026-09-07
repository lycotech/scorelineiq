"""Elo-based blend applied on top of the Poisson 1X2 probabilities.

Elo ratings are maintained and persisted by the Node side (updated in
apps/web's score-results job as real results come in) — this module
only consumes a rating snapshot to nudge the Poisson-derived win
probabilities, since the standard logistic Elo formula has no native
concept of a draw and shouldn't be trusted alone for football's 3-way
outcome. Draw probability is left to the Poisson model, which is the
statistically appropriate source for it; Elo only shifts the home/away
split based on relative team strength.
"""

# Typical Elo home-field bonus in football rating systems (e.g.
# World Football Elo Ratings uses ~100; using a more conservative value
# since it's applied on top of the Poisson model's own home advantage
# term rather than standalone).
HOME_ELO_BONUS = 60

# Weight given to the Elo-implied split vs. the Poisson-implied split.
# Kept modest: Poisson is grounded in this season's actual goal output,
# Elo is a secondary cross-check most useful when a team's squad/form
# has shifted since the stats window (promotion, injuries, transfers).
ELO_BLEND_WEIGHT = 0.25


def elo_win_probability(home_elo: float, away_elo: float) -> float:
    """Standard logistic Elo formula — P(home does not lose), i.e. treats
    the contest as two-outcome. Used only as a relative-strength signal,
    not taken as a literal match outcome probability."""
    diff = (home_elo + HOME_ELO_BONUS) - away_elo
    return 1 / (1 + 10 ** (-diff / 400))


def blend_with_elo(
    poisson_home: float,
    poisson_draw: float,
    poisson_away: float,
    home_elo: float,
    away_elo: float,
    weight: float = ELO_BLEND_WEIGHT,
) -> tuple[float, float, float]:
    elo_home_raw = elo_win_probability(home_elo, away_elo)
    elo_away_raw = 1 - elo_home_raw

    non_draw = 1 - poisson_draw
    elo_home = elo_home_raw * non_draw
    elo_away = elo_away_raw * non_draw

    blended_home = (1 - weight) * poisson_home + weight * elo_home
    blended_away = (1 - weight) * poisson_away + weight * elo_away
    blended_draw = 1 - blended_home - blended_away

    return blended_home, blended_draw, blended_away
