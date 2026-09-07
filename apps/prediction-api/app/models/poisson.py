"""Dixon-Coles-adjusted independent Poisson goal model.

Expected goals (lambda_home, mu_away) are derived from each team's
season-to-date goals-for/against relative to the league average — the
standard simplified attack/defense-strength approach, not a full
Dixon-Coles maximum-likelihood fit. A proper MLE fit needs months of
match-level history to estimate per-team attack/defense parameters
reliably; until ScorelineIQ has accumulated that from its own ingested
results, this ratio-based approximation is the honest choice — it's
grounded in real season stats rather than fabricated coefficients.

The Dixon-Coles low-score correlation correction (tau) IS applied as
originally published, using the literature-typical rho value below
rather than one fit to our own data (see RHO comment).
"""

import math

MAX_GOALS = 8

# Historically-cited value from Dixon & Coles (1997) for this
# correlation term; there isn't yet enough of our own match history to
# refit it. Revisit once backtesting (docs/TODO.md) has real data to
# validate against.
RHO = -0.13

# Average historical home-scoring boost in domestic football (teams
# score ~30-45% more at home). Same caveat as RHO: a fixed literature
# value pending our own calibration.
HOME_ADVANTAGE = 1.35


def poisson_pmf(k: int, lam: float) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * lam**k / math.factorial(k)


def dixon_coles_tau(x: int, y: int, lam: float, mu: float, rho: float = RHO) -> float:
    if x == 0 and y == 0:
        return 1 - lam * mu * rho
    if x == 0 and y == 1:
        return 1 + lam * rho
    if x == 1 and y == 0:
        return 1 + mu * rho
    if x == 1 and y == 1:
        return 1 - rho
    return 1.0


def expected_goals(
    home_goals_for_avg: float,
    home_goals_against_avg: float,
    away_goals_for_avg: float,
    away_goals_against_avg: float,
    league_avg_goals: float,
) -> tuple[float, float]:
    """Returns (lambda_home, mu_away) expected goals for each side."""
    if league_avg_goals <= 0:
        raise ValueError("league_avg_goals must be positive")

    home_attack = home_goals_for_avg / league_avg_goals
    home_defense = home_goals_against_avg / league_avg_goals
    away_attack = away_goals_for_avg / league_avg_goals
    away_defense = away_goals_against_avg / league_avg_goals

    lam = league_avg_goals * home_attack * away_defense * HOME_ADVANTAGE
    mu = league_avg_goals * away_attack * home_defense
    return lam, mu


def scoreline_matrix(lam: float, mu: float, max_goals: int = MAX_GOALS) -> list[list[float]]:
    """P(home=i, away=j) for i,j in [0, max_goals], Dixon-Coles adjusted,
    renormalized to sum to 1 after truncation."""
    matrix = [
        [
            dixon_coles_tau(i, j, lam, mu) * poisson_pmf(i, lam) * poisson_pmf(j, mu)
            for j in range(max_goals + 1)
        ]
        for i in range(max_goals + 1)
    ]
    total = sum(sum(row) for row in matrix)
    return [[cell / total for cell in row] for row in matrix]


def match_outcome_probabilities(matrix: list[list[float]]) -> tuple[float, float, float]:
    """Returns (p_home_win, p_draw, p_away_win)."""
    p_home = sum(matrix[i][j] for i in range(len(matrix)) for j in range(len(matrix[i])) if i > j)
    p_draw = sum(matrix[i][i] for i in range(len(matrix)))
    p_away = sum(matrix[i][j] for i in range(len(matrix)) for j in range(len(matrix[i])) if i < j)
    return p_home, p_draw, p_away


def top_correct_scores(matrix: list[list[float]], n: int = 3) -> list[dict]:
    scores = [
        {"home": i, "away": j, "probability": matrix[i][j]}
        for i in range(len(matrix))
        for j in range(len(matrix[i]))
    ]
    scores.sort(key=lambda s: s["probability"], reverse=True)
    return scores[:n]


def over_under_probability(matrix: list[list[float]], line: float = 2.5) -> float:
    """Returns P(total goals > line)."""
    under_or_equal = sum(
        matrix[i][j]
        for i in range(len(matrix))
        for j in range(len(matrix[i]))
        if i + j <= line
    )
    return 1 - under_or_equal


def btts_probability(matrix: list[list[float]]) -> float:
    """Returns P(both teams score >= 1)."""
    p_home_zero = sum(matrix[0][j] for j in range(len(matrix[0])))
    p_away_zero = sum(matrix[i][0] for i in range(len(matrix)))
    p_both_zero = matrix[0][0]
    return 1 - p_home_zero - p_away_zero + p_both_zero
