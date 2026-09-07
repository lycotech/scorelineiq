"""Walk-forward backtest of the Poisson/Elo model against real
historical Football-Data.org results.

Not a scheduled job — a one-off validation script per docs/TODO.md's
Phase 2 item ("Backtest against 2-3 months historical data; confirm
beats naive baseline before going live"). Run manually:

    python scripts/backtest.py

Requires FOOTBALL_DATA_API_TOKEN in the environment.

Method: for each league, pull ~3 months of finished matches, sort
chronologically, and walk through them in order. Before predicting each
match, compute both teams' goals-for/against averages and Elo ratings
from ONLY matches strictly earlier in this same window — never from
data that wouldn't have existed yet at prediction time. Teams get a
warm-up period (minimum prior matches) before being scored, since a
rate computed from 0-1 games is too noisy to be a fair test of the
model rather than of small-sample luck.

The naive baseline is "the Elo favorite always wins" (never predicts a
draw) — matching the framing in docs/PRD.md's success metrics table.
"""

import os
import sys
import urllib.request
import urllib.error
import json
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models import elo, poisson  # noqa: E402

FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4"
MIN_PRIOR_MATCHES = 3  # warm-up before a team's stats are trusted

# A handful of leagues ScorelineIQ actually covers, with enough
# historical depth on the free tier to backtest meaningfully.
COMPETITIONS = {
    "PL": 2021,  # Premier League
    "SA": 2019,  # Serie A
    "PD": 2014,  # Primera Division
}


def fetch_finished_matches(competition_id: int, date_from: str, date_to: str) -> list[dict]:
    token = os.environ.get("FOOTBALL_DATA_API_TOKEN")
    if not token:
        raise SystemExit("FOOTBALL_DATA_API_TOKEN is not set")

    url = (
        f"{FOOTBALL_DATA_BASE_URL}/competitions/{competition_id}/matches"
        f"?dateFrom={date_from}&dateTo={date_to}&status=FINISHED"
    )
    req = urllib.request.Request(url, headers={"X-Auth-Token": token})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  fetch failed ({e.code}), skipping this competition")
        return []
    return data.get("matches", [])


class TeamState:
    def __init__(self):
        self.goals_for = 0
        self.goals_against = 0
        self.played = 0
        self.elo = 1500.0

    @property
    def goals_for_avg(self) -> float:
        return self.goals_for / self.played if self.played else 0.0

    @property
    def goals_against_avg(self) -> float:
        return self.goals_against / self.played if self.played else 0.0


def predicted_1x2(home_win, draw, away_win) -> str:
    best = max(home_win, draw, away_win)
    if best == home_win:
        return "HOME_WIN"
    if best == draw:
        return "DRAW"
    return "AWAY_WIN"


def actual_outcome(home_score: int, away_score: int) -> str:
    if home_score > away_score:
        return "HOME_WIN"
    if home_score < away_score:
        return "AWAY_WIN"
    return "DRAW"


def backtest_competition(code: str, competition_id: int, date_from: str, date_to: str) -> dict:
    print(f"\n{code}: fetching {date_from}..{date_to}")
    matches = fetch_finished_matches(competition_id, date_from, date_to)
    matches = [
        m
        for m in matches
        if m.get("homeTeam") and m.get("awayTeam") and m["score"]["fullTime"]["home"] is not None
    ]
    matches.sort(key=lambda m: m["utcDate"])
    print(f"  {len(matches)} finished matches with a score")

    teams: dict[int, TeamState] = defaultdict(TeamState)

    evaluated = 0
    model_1x2_hits = 0
    baseline_1x2_hits = 0
    correct_score_hits = 0
    over_under_hits = 0
    btts_hits = 0

    for match in matches:
        home_id = match["homeTeam"]["id"]
        away_id = match["awayTeam"]["id"]
        home_score = match["score"]["fullTime"]["home"]
        away_score = match["score"]["fullTime"]["away"]

        home = teams[home_id]
        away = teams[away_id]

        league_played = [t.played for t in teams.values() if t.played > 0]
        league_goals_for = [t.goals_for for t in teams.values() if t.played > 0]
        league_avg_goals = (
            sum(league_goals_for) / sum(league_played)
            if league_played and sum(league_played) > 0
            else None
        )

        if (
            home.played >= MIN_PRIOR_MATCHES
            and away.played >= MIN_PRIOR_MATCHES
            and league_avg_goals
            and league_avg_goals > 0
        ):
            lam, mu = poisson.expected_goals(
                home.goals_for_avg,
                home.goals_against_avg,
                away.goals_for_avg,
                away.goals_against_avg,
                league_avg_goals,
            )
            matrix = poisson.scoreline_matrix(lam, mu)
            p_home, p_draw, p_away = poisson.match_outcome_probabilities(matrix)
            p_home, p_draw, p_away = elo.blend_with_elo(
                p_home, p_draw, p_away, home.elo, away.elo
            )

            predicted = predicted_1x2(p_home, p_draw, p_away)
            actual = actual_outcome(home_score, away_score)

            baseline_favorite = "HOME_WIN" if home.elo >= away.elo else "AWAY_WIN"

            top_score = poisson.top_correct_scores(matrix, n=1)[0]
            predicted_over = poisson.over_under_probability(matrix, 2.5) > 0.5
            actual_over = (home_score + away_score) > 2.5
            predicted_btts = poisson.btts_probability(matrix) > 0.5
            actual_btts = home_score > 0 and away_score > 0

            evaluated += 1
            model_1x2_hits += predicted == actual
            baseline_1x2_hits += baseline_favorite == actual
            correct_score_hits += (
                top_score["home"] == home_score and top_score["away"] == away_score
            )
            over_under_hits += predicted_over == actual_over
            btts_hits += predicted_btts == actual_btts

        # Update rolling state with this match's real result — happens
        # after prediction, so it only affects future matches.
        home.goals_for += home_score
        home.goals_against += away_score
        home.played += 1
        away.goals_for += away_score
        away.goals_against += home_score
        away.played += 1

        expected_home = elo.elo_win_probability(home.elo, away.elo)
        actual_home_score = 1.0 if home_score > away_score else 0.5 if home_score == away_score else 0.0
        K = 20
        home.elo += K * (actual_home_score - expected_home)
        away.elo -= K * (actual_home_score - expected_home)

    return {
        "competition": code,
        "total_matches": len(matches),
        "evaluated": evaluated,
        "model_1x2_accuracy": model_1x2_hits / evaluated if evaluated else None,
        "baseline_1x2_accuracy": baseline_1x2_hits / evaluated if evaluated else None,
        "correct_score_accuracy": correct_score_hits / evaluated if evaluated else None,
        "over_under_accuracy": over_under_hits / evaluated if evaluated else None,
        "btts_accuracy": btts_hits / evaluated if evaluated else None,
    }


def main():
    # A fixed historical window, not "now minus 90 days": at whatever
    # point this script is run, the current season may have only just
    # started (as little as 3-4 matchdays in), which would starve every
    # team of the warm-up history this backtest needs. Aug-Nov of the
    # previous season is deep enough into a season to have stable
    # season-to-date stats for every team, and is a completed period no
    # matter when this is run.
    date_from = "2025-08-01"
    date_to = "2025-11-01"

    results = []
    for code, competition_id in COMPETITIONS.items():
        results.append(backtest_competition(code, competition_id, date_from, date_to))

    print("\n" + "=" * 70)
    print(f"{'League':<8}{'Evaluated':<11}{'Model 1X2':<12}{'Baseline':<11}{'CorrScore':<11}{'O/U 2.5':<10}{'BTTS':<8}")
    total_evaluated = 0
    total_model_hits = 0
    total_baseline_hits = 0
    for r in results:
        if r["evaluated"] == 0:
            print(f"{r['competition']:<8}no evaluable matches (insufficient warm-up data)")
            continue
        print(
            f"{r['competition']:<8}{r['evaluated']:<11}"
            f"{r['model_1x2_accuracy']:.1%}       "
            f"{r['baseline_1x2_accuracy']:.1%}     "
            f"{r['correct_score_accuracy']:.1%}     "
            f"{r['over_under_accuracy']:.1%}    "
            f"{r['btts_accuracy']:.1%}"
        )
        total_evaluated += r["evaluated"]
        total_model_hits += r["model_1x2_accuracy"] * r["evaluated"]
        total_baseline_hits += r["baseline_1x2_accuracy"] * r["evaluated"]

    if total_evaluated:
        print("=" * 70)
        print(
            f"Overall 1X2: model {total_model_hits / total_evaluated:.1%} vs "
            f"baseline (Elo favorite always wins) {total_baseline_hits / total_evaluated:.1%} "
            f"across {total_evaluated} matches"
        )


if __name__ == "__main__":
    main()
