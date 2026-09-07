import pytest

from app.models import elo


def test_elo_win_probability_equal_ratings_favors_home():
    # Equal Elo ratings, but home bonus should still push it above 0.5.
    p = elo.elo_win_probability(1500, 1500)
    assert 0.5 < p < 0.6


def test_elo_win_probability_stronger_away_team_below_half():
    p = elo.elo_win_probability(1500, 1900)
    assert p < 0.5


def test_elo_win_probability_symmetric_around_bonus():
    # Offsetting the away team's rating by exactly the home bonus should
    # cancel it out, landing back at 0.5.
    p = elo.elo_win_probability(1500, 1500 + elo.HOME_ELO_BONUS)
    assert p == pytest.approx(0.5, abs=1e-9)


def test_blend_with_elo_zero_weight_returns_poisson_unchanged():
    home, draw, away = elo.blend_with_elo(
        poisson_home=0.5,
        poisson_draw=0.25,
        poisson_away=0.25,
        home_elo=1500,
        away_elo=1700,
        weight=0.0,
    )
    assert (home, draw, away) == pytest.approx((0.5, 0.25, 0.25))


def test_blend_with_elo_preserves_probability_sum():
    home, draw, away = elo.blend_with_elo(
        poisson_home=0.45,
        poisson_draw=0.28,
        poisson_away=0.27,
        home_elo=1600,
        away_elo=1450,
    )
    assert home + draw + away == pytest.approx(1.0)


def test_blend_with_elo_stronger_elo_team_gains_probability():
    baseline_home, _, _ = elo.blend_with_elo(0.4, 0.3, 0.3, home_elo=1500, away_elo=1500)
    boosted_home, _, _ = elo.blend_with_elo(0.4, 0.3, 0.3, home_elo=1800, away_elo=1500)
    assert boosted_home > baseline_home
