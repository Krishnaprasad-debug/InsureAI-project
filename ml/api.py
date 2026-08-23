"""HTTP API for the trained InsureAI claim-occurrence model.

Run from this directory:
    uvicorn api:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field


MODEL_PATH = Path(__file__).with_name("insureai_model.pkl")
FEATURE_COLUMNS = [
    "AGE",
    "GENDER",
    "RACE",
    "DRIVING_EXPERIENCE",
    "EDUCATION",
    "INCOME",
    "CREDIT_SCORE",
    "VEHICLE_OWNERSHIP",
    "VEHICLE_YEAR",
    "MARRIED",
    "CHILDREN",
    "POSTAL_CODE",
    "ANNUAL_MILEAGE",
    "VEHICLE_TYPE",
    "SPEEDING_VIOLATIONS",
    "DUIS",
    "PAST_ACCIDENTS",
]


class PredictionRequest(BaseModel):
    """One record using the exact feature schema used to train the model."""

    model_config = ConfigDict(populate_by_name=True)

    age: Literal["16-25", "26-39", "40-64", "65+"] = Field(alias="AGE")
    gender: Literal["female", "male"] = Field(alias="GENDER")
    race: Literal["majority", "minority"] = Field(alias="RACE")
    driving_experience: Literal["0-9y", "10-19y", "20-29y", "30y+"] = Field(alias="DRIVING_EXPERIENCE")
    education: Literal["none", "high school", "university"] = Field(alias="EDUCATION")
    income: Literal["poverty", "working class", "middle class", "upper class"] = Field(alias="INCOME")
    credit_score: float = Field(alias="CREDIT_SCORE", ge=0, le=1)
    vehicle_ownership: int = Field(alias="VEHICLE_OWNERSHIP", ge=0, le=1)
    vehicle_year: Literal["before 2015", "after 2015"] = Field(alias="VEHICLE_YEAR")
    married: int = Field(alias="MARRIED", ge=0, le=1)
    children: int = Field(alias="CHILDREN", ge=0, le=1)
    postal_code: int = Field(alias="POSTAL_CODE", ge=0)
    annual_mileage: float = Field(alias="ANNUAL_MILEAGE", ge=0)
    vehicle_type: Literal["sedan", "sports car"] = Field(alias="VEHICLE_TYPE")
    speeding_violations: int = Field(alias="SPEEDING_VIOLATIONS", ge=0)
    duis: int = Field(alias="DUIS", ge=0)
    past_accidents: int = Field(alias="PAST_ACCIDENTS", ge=0)


class PredictionResponse(BaseModel):
    # OUTCOME is claim occurrence in this dataset, not an approval decision.
    outcome: Literal["claim_unlikely", "claim_likely"]
    probability_claim: float
    probability_no_claim: float
    threshold: float
    model_version: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")
    app.state.model = joblib.load(MODEL_PATH)
    yield


app = FastAPI(
    title="InsureAI Model API",
    version="1.0.0",
    description="Predicts claim occurrence using the trained XGBoost pipeline.",
    lifespan=lifespan,
)

# Vite runs on port 5173 during local development. Replace this with your
# deployed frontend URL (and remove localhost) before production release.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "model_loaded": hasattr(app.state, "model"),
        "model_version": "xgboost-v1.0",
        "feature_count": len(FEATURE_COLUMNS),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    model = getattr(app.state, "model", None)
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    row = pd.DataFrame([payload.model_dump(by_alias=True)], columns=FEATURE_COLUMNS)
    probabilities = model.predict_proba(row)[0]
    probability_no_claim, probability_claim = (float(value) for value in probabilities)
    threshold = 0.5

    return PredictionResponse(
        outcome="claim_likely" if probability_claim >= threshold else "claim_unlikely",
        probability_claim=round(probability_claim, 6),
        probability_no_claim=round(probability_no_claim, 6),
        threshold=threshold,
        model_version="xgboost-v1.0",
    )
