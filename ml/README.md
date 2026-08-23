# InsureAI model API

This API serves the `insureai_model.pkl` pipeline trained by `train_model.py`.
It predicts whether an insurance claim occurs (`OUTCOME`); it does **not** make an approval or rejection decision.

## Setup and run

From the project root in PowerShell:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r ml\requirements.txt
.\.venv\Scripts\uvicorn.exe api:app --app-dir ml --reload --port 8000
```

Open `http://127.0.0.1:8000/docs` to test the interactive API documentation.

## Example prediction

```powershell
$body = @{
  AGE = '26-39'; GENDER = 'female'; RACE = 'majority'; DRIVING_EXPERIENCE = '10-19y'
  EDUCATION = 'university'; INCOME = 'middle class'; CREDIT_SCORE = 0.72
  VEHICLE_OWNERSHIP = 1; VEHICLE_YEAR = 'after 2015'; MARRIED = 1; CHILDREN = 0
  POSTAL_CODE = 10238; ANNUAL_MILEAGE = 12000; VEHICLE_TYPE = 'sedan'
  SPEEDING_VIOLATIONS = 0; DUIS = 0; PAST_ACCIDENTS = 0
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/predict -ContentType 'application/json' -Body $body
```
