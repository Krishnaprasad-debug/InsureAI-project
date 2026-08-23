import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

from xgboost import XGBClassifier


# --------------------------------------------------
# 1. Load Dataset
# --------------------------------------------------

df = pd.read_csv("Car_Insurance_Claim.csv")

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)


# --------------------------------------------------
# 2. Remove unnecessary ID column
# --------------------------------------------------

df = df.drop("ID", axis=1)


# --------------------------------------------------
# 3. Separate features and target
# --------------------------------------------------

X = df.drop("OUTCOME", axis=1)
y = df["OUTCOME"].astype(int)


# --------------------------------------------------
# 4. Identify categorical and numerical columns
# --------------------------------------------------

categorical_columns = [
    "AGE",
    "GENDER",
    "RACE",
    "DRIVING_EXPERIENCE",
    "EDUCATION",
    "INCOME",
    "VEHICLE_YEAR",
    "VEHICLE_TYPE"
]

numerical_columns = [
    "CREDIT_SCORE",
    "VEHICLE_OWNERSHIP",
    "MARRIED",
    "CHILDREN",
    "POSTAL_CODE",
    "ANNUAL_MILEAGE",
    "SPEEDING_VIOLATIONS",
    "DUIS",
    "PAST_ACCIDENTS"
]


# --------------------------------------------------
# 5. Preprocessing
# --------------------------------------------------

categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            )
        )
    ]
)


numerical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        )
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            categorical_pipeline,
            categorical_columns
        ),
        (
            "numerical",
            numerical_pipeline,
            numerical_columns
        )
    ]
)


# --------------------------------------------------
# 6. Create XGBoost Model
# --------------------------------------------------

model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="binary:logistic",
    eval_metric="logloss",
    random_state=42
)


# --------------------------------------------------
# 7. Create complete ML Pipeline
# --------------------------------------------------

pipeline = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            model
        )
    ]
)


# --------------------------------------------------
# 8. Split Dataset
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# --------------------------------------------------
# 9. Train XGBoost
# --------------------------------------------------

print("\nTraining XGBoost model...")

pipeline.fit(X_train, y_train)

print("Training completed!")


# --------------------------------------------------
# 10. Make Predictions
# --------------------------------------------------

y_pred = pipeline.predict(X_test)


# --------------------------------------------------
# 11. Evaluate Model
# --------------------------------------------------

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)


print("\n==============================")
print("MODEL PERFORMANCE")
print("==============================")

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")


print("\nClassification Report:")
print(classification_report(
    y_test,
    y_pred,
    zero_division=0
))


print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))


# --------------------------------------------------
# 12. Save Complete Pipeline
# --------------------------------------------------

model_file = "insureai_model.pkl"

joblib.dump(
    pipeline,
    model_file
)

print("\nModel saved successfully!")
print("Saved as:", model_file)