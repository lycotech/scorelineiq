from fastapi import FastAPI

from app.models import elo, poisson
from app.schemas import CorrectScore, PredictRequest, PredictResponse

# v2: home advantage is now split between the sides so expected total
# goals for average teams equals the league average (v1 over-stated it by
# 17.5%). Predictions from different versions are not directly comparable.
MODEL_VERSION = "poisson-dixon-coles-elo-v2"

app = FastAPI(title="ScorelineIQ Prediction Engine")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    lam, mu = poisson.expected_goals(
        home_goals_for_avg=request.home_team.goals_for_avg,
        home_goals_against_avg=request.home_team.goals_against_avg,
        away_goals_for_avg=request.away_team.goals_for_avg,
        away_goals_against_avg=request.away_team.goals_against_avg,
        league_avg_goals=request.league_avg_goals,
    )

    matrix = poisson.scoreline_matrix(lam, mu)
    poisson_home, poisson_draw, poisson_away = poisson.match_outcome_probabilities(matrix)

    home_win, draw, away_win = elo.blend_with_elo(
        poisson_home,
        poisson_draw,
        poisson_away,
        home_elo=request.home_team.elo_rating,
        away_elo=request.away_team.elo_rating,
    )

    top_scores = poisson.top_correct_scores(matrix, n=3)
    best_score = top_scores[0]

    return PredictResponse(
        home_win_probability=home_win,
        draw_probability=draw,
        away_win_probability=away_win,
        predicted_score_home=best_score["home"],
        predicted_score_away=best_score["away"],
        top_correct_scores=[CorrectScore(**s) for s in top_scores],
        over_2_5_probability=poisson.over_under_probability(matrix, line=2.5),
        btts_probability=poisson.btts_probability(matrix),
        expected_total_goals=round(lam + mu, 2),
        confidence=round(max(home_win, draw, away_win) * 100, 1),
        model_version=MODEL_VERSION,
    )
