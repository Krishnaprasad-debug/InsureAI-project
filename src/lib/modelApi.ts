export interface ModelPredictionInput {
  AGE: '16-25' | '26-39' | '40-64' | '65+';
  GENDER: 'female' | 'male';
  RACE: 'majority' | 'minority';
  DRIVING_EXPERIENCE: '0-9y' | '10-19y' | '20-29y' | '30y+';
  EDUCATION: 'none' | 'high school' | 'university';
  INCOME: 'poverty' | 'working class' | 'middle class' | 'upper class';
  CREDIT_SCORE: number;
  VEHICLE_OWNERSHIP: 0 | 1;
  VEHICLE_YEAR: 'before 2015' | 'after 2015';
  MARRIED: 0 | 1;
  CHILDREN: 0 | 1;
  POSTAL_CODE: number;
  ANNUAL_MILEAGE: number;
  VEHICLE_TYPE: 'sedan' | 'sports car';
  SPEEDING_VIOLATIONS: number;
  DUIS: number;
  PAST_ACCIDENTS: number;
}

export interface ModelPredictionResponse {
  outcome: 'claim_unlikely' | 'claim_likely';
  probability_claim: number;
  probability_no_claim: number;
  threshold: number;
  model_version: string;
}

export class ModelApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ModelApiError';
  }
}

const modelApiUrl = (import.meta.env.VITE_ML_API_URL as string | undefined)?.replace(/\/$/, '')
  || (import.meta.env.VITE_MODEL_API_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://127.0.0.1:8000';

export async function predictWithModel(input: ModelPredictionInput): Promise<ModelPredictionResponse> {
  let response: Response;

  try {
    response = await fetch(`${modelApiUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ModelApiError('Cannot reach the prediction service. Please try again shortly.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === 'string'
      ? body.detail
      : response.status === 422
        ? 'Please check the model input fields and try again.'
        : 'Prediction service failed. Please try again shortly.';
    throw new ModelApiError(detail, response.status);
  }

  return response.json() as Promise<ModelPredictionResponse>;
}
