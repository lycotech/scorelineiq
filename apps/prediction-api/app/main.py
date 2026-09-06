from fastapi import FastAPI

app = FastAPI(title="ScorelineIQ Prediction Engine")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
