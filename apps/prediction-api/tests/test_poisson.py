import math

import pytest

from app.models import poisson


def test_poisson_pmf_zero_lambda():
    assert poisson.poisson_pmf(0, 0) == 1.0
    assert poisson.poisson_pmf(1, 0) == 0.0


def test_poisson_pmf_matches_known_value():
    # Poisson(2; lambda=2) = e^-2 * 2^2 / 2! ≈ 0.2707
    assert poisson.poisson_pmf(2, 2) == pytest.approx(0.2707, abs=1e-4)


def test_expected_goals_requires_positive_league_average():
    with pytest.raises(ValueError):
        poisson.expected_goals(1, 1, 1, 1, league_avg_goals=0)


def test_expected_goals_average_teams_sum_to_twice_league_average():
    # Two average teams (attack/defense ratios of 1) must produce the
    # league's average total goals: home + away == 2 * league_avg_goals.
    # (v1 gave 1.175 * that, over-stating goals for every fixture.)
    for league_avg in (1.2, 1.4, 1.6):
        lam, mu = poisson.expected_goals(league_avg, league_avg, league_avg, league_avg, league_avg)
        assert lam + mu == pytest.approx(2 * league_avg)


def test_expected_goals_keeps_home_advantage_ratio():
    lam, mu = poisson.expected_goals(1.4, 1.4, 1.4, 1.4, league_avg_goals=1.4)
    assert lam / mu == pytest.approx(poisson.HOME_ADVANTAGE)
    assert lam > mu


def test_expected_goals_same_matchup_either_venue_differs_only_by_home_ratio():
    # Team A (scores 1.8, concedes 1.0) vs team B (1.1, 1.5). A's expected
    # goals against B's defence are the same number in both fixtures
    # except for the venue factor, so the ratio is exactly HOME_ADVANTAGE.
    a_home, _ = poisson.expected_goals(1.8, 1.0, 1.1, 1.5, league_avg_goals=1.4)
    _, a_away = poisson.expected_goals(1.1, 1.5, 1.8, 1.0, league_avg_goals=1.4)
    assert a_home / a_away == pytest.approx(poisson.HOME_ADVANTAGE)


def test_scoreline_matrix_sums_to_one():
    matrix = poisson.scoreline_matrix(1.5, 1.1)
    total = sum(sum(row) for row in matrix)
    assert total == pytest.approx(1.0)


def test_match_outcome_probabilities_sum_to_one():
    matrix = poisson.scoreline_matrix(1.5, 1.1)
    home, draw, away = poisson.match_outcome_probabilities(matrix)
    assert home + draw + away == pytest.approx(1.0)
    assert home > away  # stronger home expected goals should favor home


def test_match_outcome_symmetric_when_lambda_equals_mu():
    matrix = poisson.scoreline_matrix(1.3, 1.3)
    home, draw, away = poisson.match_outcome_probabilities(matrix)
    assert home == pytest.approx(away, abs=1e-9)


def test_top_correct_scores_returns_requested_count_sorted_desc():
    matrix = poisson.scoreline_matrix(1.5, 1.1)
    top = poisson.top_correct_scores(matrix, n=3)
    assert len(top) == 3
    probs = [s["probability"] for s in top]
    assert probs == sorted(probs, reverse=True)


def test_over_under_probability_zero_lambda_is_zero():
    matrix = poisson.scoreline_matrix(0, 0)
    assert poisson.over_under_probability(matrix, line=2.5) == pytest.approx(0.0, abs=1e-9)


def test_btts_probability_zero_lambda_is_zero():
    matrix = poisson.scoreline_matrix(0, 0)
    assert poisson.btts_probability(matrix) == pytest.approx(0.0, abs=1e-9)


def test_btts_probability_high_scoring_is_high():
    matrix = poisson.scoreline_matrix(2.5, 2.5)
    assert poisson.btts_probability(matrix) > 0.7


def test_dixon_coles_tau_reduces_to_one_away_from_low_scores():
    assert poisson.dixon_coles_tau(2, 2, 1.5, 1.1) == 1.0
    assert poisson.dixon_coles_tau(3, 0, 1.5, 1.1) == 1.0
