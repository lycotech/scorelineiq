from pydantic import BaseModel, Field


class TeamStats(BaseModel):
    goals_for_avg: float = Field(..., ge=0, description="Season-to-date goals scored per game")
    goals_against_avg: float = Field(
        ..., ge=0, description="Season-to-date goals conceded per game"
    )
    elo_rating: float = Field(..., description="Current Elo rating")


class PredictRequest(BaseModel):
    home_team: TeamStats
    away_team: TeamStats
    league_avg_goals: float = Field(
        ..., gt=0, description="League average goals scored per team per game"
    )


class CorrectScore(BaseModel):
    home: int
    away: int
    probability: float


class PredictResponse(BaseModel):
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    predicted_score_home: int
    predicted_score_away: int
    top_correct_scores: list[CorrectScore]
    over_2_5_probability: float
    btts_probability: float
    expected_total_goals: float
    confidence: float
    model_version: str
