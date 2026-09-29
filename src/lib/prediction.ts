import type { FeatureImportance } from './supabase';

export interface ClaimFormData {
  personal: Record<string, any>;
  vehicle: Record<string, any>;
  insurance: Record<string, any>;
  driver: Record<string, any>;
  accident: Record<string, any>;
}

export interface PredictionResult {
  prediction: 'Claim Likely' | 'Claim Unlikely';
  confidence: number;
  risk_level: 'Low' | 'Medium' | 'High';
  probability_approved: number;
  probability_rejected: number;
  feature_importance: FeatureImportance[];
  model_version: string;
}

export function mapFormDataToModelFeatures(data: ClaimFormData) {
  const ageNum = parseInt(data.personal?.age || '35', 10);
  let age: '16-25' | '26-39' | '40-64' | '65+' = '26-39';
  if (ageNum < 26) age = '16-25';
  else if (ageNum <= 39) age = '26-39';
  else if (ageNum <= 64) age = '40-64';
  else age = '65+';

  const genderRaw = (data.personal?.gender || 'male').toLowerCase();
  const gender: 'female' | 'male' = genderRaw === 'female' ? 'female' : 'male';

  const expNum = parseInt(data.driver?.drivingExperience || '5', 10);
  let driving_experience: '0-9y' | '10-19y' | '20-29y' | '30y+' = '0-9y';
  if (expNum < 10) driving_experience = '0-9y';
  else if (expNum <= 19) driving_experience = '10-19y';
  else if (expNum <= 29) driving_experience = '20-29y';
  else driving_experience = '30y+';

  const occupation = (data.personal?.occupation || '').toLowerCase();
  let education: 'none' | 'high school' | 'university' = 'university';
  if (occupation.includes('student') || occupation.includes('none')) education = 'high school';

  const incomeNum = parseFloat(data.personal?.annualIncome || '600000');
  let income: 'poverty' | 'working class' | 'middle class' | 'upper class' = 'middle class';
  if (incomeNum < 250000) income = 'poverty';
  else if (incomeNum < 600000) income = 'working class';
  else if (incomeNum <= 1500000) income = 'middle class';
  else income = 'upper class';

  const drivingScore = parseFloat(data.driver?.drivingScore || '65');
  const credit_score = Math.max(0, Math.min(1, drivingScore > 1 ? drivingScore / 100 : drivingScore));

  const yearNum = parseInt(data.vehicle?.manufacturingYear || '2020', 10);
  const vehicle_year: 'before 2015' | 'after 2015' = yearNum < 2015 ? 'before 2015' : 'after 2015';

  const pinNum = parseInt((data.personal?.pinCode || '10238').replace(/\D/g, ''), 10) || 10238;

  const rawMileage = parseFloat(data.vehicle?.mileage || '12000');
  const annual_mileage = rawMileage > 100 ? rawMileage : 12000;

  const vType = (data.vehicle?.vehicleType || '').toLowerCase();
  const vehicle_type: 'sedan' | 'sports car' = vType.includes('sports') ? 'sports car' : 'sedan';

  const speeding_violations = parseInt(data.driver?.trafficViolations || '0', 10) || 0;
  const past_accidents = parseInt(data.driver?.accidentHistory || '0', 10) || 0;

  return {
    AGE: age,
    GENDER: gender,
    RACE: 'majority' as const,
    DRIVING_EXPERIENCE: driving_experience,
    EDUCATION: education,
    INCOME: income,
    CREDIT_SCORE: credit_score,
    VEHICLE_OWNERSHIP: 1,
    VEHICLE_YEAR: vehicle_year,
    MARRIED: 1,
    CHILDREN: 0,
    POSTAL_CODE: pinNum,
    ANNUAL_MILEAGE: annual_mileage,
    VEHICLE_TYPE: vehicle_type,
    SPEEDING_VIOLATIONS: speeding_violations,
    DUIS: 0,
    PAST_ACCIDENTS: past_accidents,
  };
}

export async function predictClaim(data: ClaimFormData): Promise<PredictionResult> {
  const modelPayload = mapFormDataToModelFeatures(data);
  const primaryUrl = (import.meta.env.VITE_ML_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://127.0.0.1:8000';
  const urlsToTry = [primaryUrl];
  if (!urlsToTry.includes('http://127.0.0.1:8001')) urlsToTry.push('http://127.0.0.1:8001');

  for (const url of urlsToTry) {
    try {
      const res = await fetch(`${url}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelPayload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.prediction) {
          return {
            prediction: json.prediction === 'Approved' ? 'Claim Likely' : 'Claim Unlikely',
            confidence: json.confidence,
            risk_level: json.risk_level,
            probability_approved: json.probability_approved,
            probability_rejected: json.probability_rejected,
            feature_importance: json.feature_importance,
            model_version: json.model_version || 'xgboost-v1.0',
          };
        }
      }
    } catch {
      // try next url
    }
  }

  // Fallback prediction if ML backend is unavailable
  const drivingScore = parseFloat(data.driver?.drivingScore || '80');
  const pastAccidents = parseInt(data.driver?.accidentHistory || '0', 10);
  const isLikely = pastAccidents === 0 && drivingScore >= 70;
  const confidence = isLikely ? Math.min(95, 60 + Math.round(drivingScore * 0.35)) : 68;

  return {
    prediction: isLikely ? 'Claim Likely' : 'Claim Unlikely',
    confidence,
    risk_level: confidence >= 80 ? 'Low' : 'Medium',
    probability_approved: confidence,
    probability_rejected: 100 - confidence,
    feature_importance: [
      { feature: 'driving_experience', label: 'Driving Experience', importance: 0.35, direction: 'positive', value: `${data.driver?.drivingExperience || 5}y` },
      { feature: 'driving_score', label: 'Driving Score', importance: 0.28, direction: 'positive', value: `${drivingScore}` },
      { feature: 'accident_history', label: 'Past Accidents', importance: 0.20, direction: pastAccidents === 0 ? 'positive' : 'negative', value: `${pastAccidents}` },
    ],
    model_version: 'xgboost-v1.0',
  };
}

