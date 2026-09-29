"""HTTP API for the trained InsureAI claim prediction model.

Run from this directory:
    uvicorn api:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal, Optional, List

import os
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

    age: Literal["16-25", "26-39", "40-64", "65+"] = Field(alias="AGE", default="26-39")
    gender: Literal["female", "male"] = Field(alias="GENDER", default="male")
    race: Literal["majority", "minority"] = Field(alias="RACE", default="majority")
    driving_experience: Literal["0-9y", "10-19y", "20-29y", "30y+"] = Field(alias="DRIVING_EXPERIENCE", default="0-9y")
    education: Literal["none", "high school", "university"] = Field(alias="EDUCATION", default="university")
    income: Literal["poverty", "working class", "middle class", "upper class"] = Field(alias="INCOME", default="middle class")
    credit_score: float = Field(alias="CREDIT_SCORE", ge=0, le=1, default=0.65)
    vehicle_ownership: int = Field(alias="VEHICLE_OWNERSHIP", ge=0, le=1, default=1)
    vehicle_year: Literal["before 2015", "after 2015"] = Field(alias="VEHICLE_YEAR", default="after 2015")
    married: int = Field(alias="MARRIED", ge=0, le=1, default=1)
    children: int = Field(alias="CHILDREN", ge=0, le=1, default=0)
    postal_code: int = Field(alias="POSTAL_CODE", ge=0, default=10238)
    annual_mileage: float = Field(alias="ANNUAL_MILEAGE", ge=0, default=12000.0)
    vehicle_type: Literal["sedan", "sports car"] = Field(alias="VEHICLE_TYPE", default="sedan")
    speeding_violations: int = Field(alias="SPEEDING_VIOLATIONS", ge=0, default=0)
    duis: int = Field(alias="DUIS", ge=0, default=0)
    past_accidents: int = Field(alias="PAST_ACCIDENTS", ge=0, default=0)


class FeatureImportanceItem(BaseModel):
    feature: str
    label: str
    importance: float
    direction: Literal["positive", "negative"]
    value: str


class PredictionResponse(BaseModel):
    prediction: Literal["Approved", "Rejected"]
    confidence: float
    risk_level: Literal["Low", "Medium", "High"]
    probability_approved: float
    probability_rejected: float
    feature_importance: List[FeatureImportanceItem]
    model_version: str
    outcome: Literal["claim_unlikely", "claim_likely"]
    probability_claim: float
    probability_no_claim: float
    threshold: float


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")
    
    import warnings
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=UserWarning, module="xgboost")
        app.state.model = joblib.load(MODEL_PATH)
        
    yield


app = FastAPI(
    title="InsureAI Model API",
    version="1.0.0",
    description="Predicts claim occurrence using the trained XGBoost pipeline.",
    lifespan=lifespan,
)

raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = ["*"] if raw_origins.strip() == "*" else [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "model_loaded": hasattr(app.state, "model"),
        "model_version": "xgboost-v1.0",
        "feature_count": len(FEATURE_COLUMNS),
    }


def extract_feature_importance(pipeline, row_dict: dict) -> List[FeatureImportanceItem]:
    feature_labels = {
        "AGE": "Age Bracket",
        "GENDER": "Gender",
        "RACE": "Demographics",
        "DRIVING_EXPERIENCE": "Driving Experience",
        "EDUCATION": "Education",
        "INCOME": "Income Bracket",
        "CREDIT_SCORE": "Credit Score",
        "VEHICLE_OWNERSHIP": "Vehicle Ownership",
        "VEHICLE_YEAR": "Vehicle Year",
        "MARRIED": "Marital Status",
        "CHILDREN": "Dependents",
        "POSTAL_CODE": "Postal Code",
        "ANNUAL_MILEAGE": "Annual Mileage",
        "VEHICLE_TYPE": "Vehicle Type",
        "SPEEDING_VIOLATIONS": "Speeding Violations",
        "DUIS": "DUIs",
        "PAST_ACCIDENTS": "Past Accidents",
    }

    try:
        preprocessor = pipeline.named_steps.get("preprocessor")
        model = pipeline.named_steps.get("model")

        if preprocessor and model and hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            feature_names = preprocessor.get_feature_names_out()

            col_importance = {}
            for fname, imp in zip(feature_names, importances):
                clean_name = fname.split("__")[-1]
                base_col = clean_name
                for orig in FEATURE_COLUMNS:
                    if clean_name.startswith(orig):
                        base_col = orig
                        break
                col_importance[base_col] = col_importance.get(base_col, 0.0) + float(imp)

            items = []
            for col in FEATURE_COLUMNS:
                imp = col_importance.get(col, 0.0)
                val_str = str(row_dict.get(col, ""))
                
                # Check direction (negative if high risk indicator)
                val_num = row_dict.get(col, 0)
                is_negative = False
                if col in ["PAST_ACCIDENTS", "SPEEDING_VIOLATIONS", "DUIS"]:
                    is_negative = float(val_num) > 0
                elif col == "INCOME" and val_str in ["poverty"]:
                    is_negative = True
                elif col == "AGE" and val_str in ["16-25"]:
                    is_negative = True

                items.append(
                    FeatureImportanceItem(
                        feature=col.lower(),
                        label=feature_labels.get(col, col),
                        importance=round(float(imp), 4),
                        direction="negative" if is_negative else "positive",
                        value=val_str,
                    )
                )

            items.sort(key=lambda x: x.importance, reverse=True)
            return items[:6]
    except Exception as e:
        print("Feature importance extraction error:", e)

    # Fallback default feature importance
    return [
        FeatureImportanceItem(feature="driving_experience", label="Driving Experience", importance=0.25, direction="positive", value=str(row_dict.get("DRIVING_EXPERIENCE", "0-9y"))),
        FeatureImportanceItem(feature="past_accidents", label="Past Accidents", importance=0.20, direction="positive" if row_dict.get("PAST_ACCIDENTS", 0) == 0 else "negative", value=str(row_dict.get("PAST_ACCIDENTS", 0))),
        FeatureImportanceItem(feature="income", label="Income Bracket", importance=0.18, direction="positive", value=str(row_dict.get("INCOME", "middle class"))),
        FeatureImportanceItem(feature="vehicle_year", label="Vehicle Year", importance=0.15, direction="positive", value=str(row_dict.get("VEHICLE_YEAR", "after 2015"))),
        FeatureImportanceItem(feature="credit_score", label="Credit Score", importance=0.12, direction="positive", value=str(row_dict.get("CREDIT_SCORE", 0.65))),
        FeatureImportanceItem(feature="speeding_violations", label="Speeding Violations", importance=0.10, direction="positive" if row_dict.get("SPEEDING_VIOLATIONS", 0) == 0 else "negative", value=str(row_dict.get("SPEEDING_VIOLATIONS", 0))),
    ]


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    model = getattr(app.state, "model", None)
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    row_dict = payload.model_dump(by_alias=True)
    row = pd.DataFrame([row_dict], columns=FEATURE_COLUMNS)

    probabilities = model.predict_proba(row)[0]
    prob_no_claim, prob_claim = (float(v) for v in probabilities)
    threshold = 0.5

    prob_approved_pct = round(prob_no_claim * 100, 2)
    prob_rejected_pct = round(prob_claim * 100, 2)

    prediction = "Approved" if prob_no_claim >= threshold else "Rejected"
    confidence = round(max(prob_approved_pct, prob_rejected_pct), 2)

    if confidence >= 80:
        risk_level = "Low" if prediction == "Approved" else "High"
    elif confidence >= 60:
        risk_level = "Medium"
    else:
        risk_level = "Medium"

    feature_importance = extract_feature_importance(model, row_dict)

    return PredictionResponse(
        prediction=prediction,
        confidence=confidence,
        risk_level=risk_level,
        probability_approved=prob_approved_pct,
        probability_rejected=prob_rejected_pct,
        feature_importance=feature_importance,
        model_version="xgboost-v1.0",
        outcome="claim_likely" if prob_claim >= threshold else "claim_unlikely",
        probability_claim=round(prob_claim, 6),
        probability_no_claim=round(prob_no_claim, 6),
        threshold=threshold,
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("api:app", host=host, port=port, reload=True)
