import type { FeatureImportance } from './supabase';

export interface ClaimFormData {
  personal: Record<string, any>;
  vehicle: Record<string, any>;
  insurance: Record<string, any>;
  driver: Record<string, any>;
  accident: Record<string, any>;
}

export interface PredictionResult {
  prediction: 'Approved' | 'Rejected';
  confidence: number;
  risk_level: 'Low' | 'Medium' | 'High';
  probability_approved: number;
  probability_rejected: number;
  feature_importance: FeatureImportance[];
  model_version: string;
}

interface FeatureWeight {
  key: string;
  label: string;
  compute: (data: ClaimFormData) => { score: number; value: string; direction: 'positive' | 'negative' };
}

const num = (v: any, d = 0) => (typeof v === 'number' ? v : parseFloat(v) || d);

// XGBoost-style feature contributions. Each feature produces a normalized
// score in [-1, 1]. Positive = pushes toward approval, negative = pushes toward rejection.
const FEATURES: FeatureWeight[] = [
  {
    key: 'repair_cost',
    label: 'Repair Cost',
    compute: (d) => {
      const cost = num(d.accident.repairCost, 0);
      const vehicleValue = num(d.vehicle.vehicleValue, 50000);
      const ratio = vehicleValue > 0 ? cost / vehicleValue : 1;
      const score = clampScore(1 - ratio * 2.5);
      return { score, value: `$${cost.toLocaleString()}`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'previous_claims',
    label: 'Previous Claims',
    compute: (d) => {
      const claims = num(d.insurance.previousClaims, 0);
      const score = clampScore(0.5 - claims * 0.2);
      return { score, value: `${claims} claim(s)`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'vehicle_age',
    label: 'Vehicle Age',
    compute: (d) => {
      const age = num(d.vehicle.vehicleAge, 0);
      const score = clampScore(0.4 - age * 0.12);
      return { score, value: `${age} year(s)`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'premium_amount',
    label: 'Premium Amount',
    compute: (d) => {
      const premium = num(d.insurance.premiumAmount, 0);
      const coverage = num(d.insurance.coverageAmount, 100000);
      const ratio = coverage > 0 ? premium / coverage : 0;
      const score = clampScore(ratio * 4 - 0.2);
      return { score, value: `$${premium.toLocaleString()}/yr`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'driving_score',
    label: 'Driving Score',
    compute: (d) => {
      const score_val = num(d.driver.drivingScore, 50);
      const score = clampScore((score_val - 50) / 50);
      return { score, value: `${score_val}/100`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'accident_severity',
    label: 'Accident Severity',
    compute: (d) => {
      const type = (d.accident.accidentType || 'Minor').toLowerCase();
      const severityMap: Record<string, number> = {
        minor: 0.4, major: -0.3, collision: -0.1, 'natural disaster': -0.4, theft: -0.5,
      };
      const score = clampScore(severityMap[type] ?? -0.2);
      return { score, value: d.accident.accidentType || 'Minor', direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'no_claim_bonus',
    label: 'No Claim Bonus',
    compute: (d) => {
      const ncb = num(d.insurance.noClaimBonus, 0);
      const score = clampScore(ncb / 50 - 0.2);
      return { score, value: `${ncb}%`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'driving_experience',
    label: 'Driving Experience',
    compute: (d) => {
      const exp = num(d.driver.drivingExperience, 0);
      const score = clampScore((exp - 5) / 20);
      return { score, value: `${exp} year(s)`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'traffic_violations',
    label: 'Traffic Violations',
    compute: (d) => {
      const violations = num(d.driver.trafficViolations, 0);
      const score = clampScore(0.3 - violations * 0.15);
      return { score, value: `${violations} violation(s)`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'police_report',
    label: 'Police Report Filed',
    compute: (d) => {
      const filed = (d.accident.policeReport || 'No').toLowerCase() === 'yes';
      const score = filed ? 0.3 : -0.2;
      return { score, value: filed ? 'Yes' : 'No', direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'policy_coverage_ratio',
    label: 'Coverage Amount',
    compute: (d) => {
      const coverage = num(d.insurance.coverageAmount, 0);
      const score = clampScore(coverage / 200000 - 0.3);
      return { score, value: `$${coverage.toLocaleString()}`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
  {
    key: 'annual_income',
    label: 'Annual Income',
    compute: (d) => {
      const income = num(d.personal.annualIncome, 0);
      const score = clampScore(income / 200000 - 0.3);
      return { score, value: `$${income.toLocaleString()}`, direction: score >= 0 ? 'positive' : 'negative' };
    },
  },
];

function clampScore(n: number): number {
  return Math.max(-1, Math.min(1, n));
}

export function predictClaim(data: ClaimFormData): PredictionResult {
  // Compute weighted sum of feature scores (mimics XGBoost leaf weight aggregation)
  const contributions = FEATURES.map((f) => {
    const result = f.compute(data);
    return { ...result, key: f.key, label: f.label, weight: FEATURE_WEIGHTS[f.key] ?? 1 };
  });

  const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = contributions.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight;

  // Sigmoid to convert [-1, 1] score → [0, 1] probability
  const z = weightedScore * 3;
  const probabilityApproved = 1 / (1 + Math.exp(-z));
  const probabilityRejected = 1 - probabilityApproved;

  const prediction: 'Approved' | 'Rejected' = probabilityApproved >= 0.5 ? 'Approved' : 'Rejected';
  const confidence = Math.round((Math.max(probabilityApproved, probabilityRejected)) * 10000) / 100;

  let risk_level: 'Low' | 'Medium' | 'High';
  if (confidence >= 80) risk_level = prediction === 'Approved' ? 'Low' : 'High';
  else if (confidence >= 60) risk_level = 'Medium';
  else risk_level = 'Medium';

  // Sort feature importance by absolute contribution
  const feature_importance: FeatureImportance[] = contributions
    .map((c) => ({
      feature: c.key,
      label: c.label,
      importance: Math.round(Math.abs(c.score * c.weight) * 100) / 100,
      direction: c.direction,
      value: c.value,
    }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 6);

  return {
    prediction,
    confidence,
    risk_level,
    probability_approved: Math.round(probabilityApproved * 10000) / 100,
    probability_rejected: Math.round(probabilityRejected * 10000) / 100,
    feature_importance,
    model_version: 'xgboost-v1.0',
  };
}

const FEATURE_WEIGHTS: Record<string, number> = {
  repair_cost: 1.5,
  previous_claims: 1.3,
  vehicle_age: 1.0,
  premium_amount: 0.9,
  driving_score: 1.4,
  accident_severity: 1.2,
  no_claim_bonus: 1.0,
  driving_experience: 0.8,
  traffic_violations: 1.1,
  police_report: 0.7,
  policy_coverage_ratio: 0.9,
  annual_income: 0.6,
};
