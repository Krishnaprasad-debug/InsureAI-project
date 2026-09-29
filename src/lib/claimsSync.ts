import { supabase, type Claim, type Prediction } from './supabase';

const CLAIMS_STORAGE_KEY = 'insureai_all_claims';
const PREDICTIONS_STORAGE_KEY = 'insureai_all_predictions';

const INITIAL_SAMPLE_CLAIMS: Claim[] = [
  {
    id: 'claim-91mcf0xw',
    user_id: 'cust-krishnaprasad',
    claim_number: 'CLM-91MCF0XW',
    status: 'pending',
    company_decision: 'Pending',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    personal_info: {
      fullName: 'Krishnaprasad',
      age: 34,
      gender: 'Male',
      occupation: 'Software Engineer',
      annualIncome: 850000,
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pinCode: '641001'
    },
    vehicle_details: {
      vehicleType: 'Car',
      vehicleBrand: 'Suzuki',
      vehicleModel: 'Swift',
      vehicleAge: 3,
      manufacturingYear: 2023,
      fuelType: 'Petrol',
      transmission: 'Manual',
      engineCapacity: 1197,
      vehicleValue: 650000,
      mileage: 18.5,
      registrationState: 'TN'
    },
    insurance_details: {
      policyType: 'Comprehensive',
      policyDuration: '1 Year',
      premiumAmount: 14500,
      policyStartDate: '2025-01-10',
      policyEndDate: '2026-01-10',
      noClaimBonus: 20,
      previousClaims: 0,
      coverageAmount: 600000,
      insuranceCompany: 'InsureAI General Insurance'
    },
    driver_details: {
      drivingExperience: 7,
      licenseValidity: 'Valid',
      trafficViolations: 0,
      accidentHistory: 0,
      drivingScore: 88
    },
    accident_details: {
      accidentType: 'Major Collision',
      repairCost: 45000,
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      location: 'Avinashi Road, Coimbatore',
      policeReport: 'Yes',
      hospitalization: 'No',
      thirdPartyDamage: 'No',
      weatherCondition: 'Clear',
      description: 'Side panel collision at busy intersection during morning traffic.'
    },
    documents: [
      { id: 'doc-1', type: 'Driving License', name: 'license_krishna.pdf', size: 102400, dataUrl: '', uploaded_at: new Date().toISOString() },
      { id: 'doc-2', type: 'RC Book', name: 'rc_swift.pdf', size: 204800, dataUrl: '', uploaded_at: new Date().toISOString() }
    ],
    timeline: [
      { status: 'submitted', label: 'Claim Submitted', description: 'Claim submitted for officer review.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), completed: true },
      { status: 'prediction', label: 'AI Prediction', description: 'XGBoost model completed analysis.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), completed: true },
      { status: 'verification', label: 'Document Verification', description: 'Awaiting officer verification.', timestamp: '', completed: false },
      { status: 'review', label: 'Officer Review', description: 'Awaiting officer final decision.', timestamp: '', completed: false },
      { status: 'completed', label: 'Completed', description: 'Final decision pending.', timestamp: '', completed: false }
    ],
    admin_remarks: null,
    reviewed_by: null,
    reviewed_at: null
  },
  {
    id: 'claim-nph8gbet',
    user_id: 'cust-rahul',
    claim_number: 'CLM-NPH8GBET',
    status: 'pending',
    company_decision: 'Pending',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    personal_info: {
      fullName: 'Rahul Sharma',
      age: 29,
      gender: 'Male',
      occupation: 'Financial Analyst',
      annualIncome: 720000,
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001'
    },
    vehicle_details: {
      vehicleType: 'Car',
      vehicleBrand: 'Honda',
      vehicleModel: 'City',
      vehicleAge: 2,
      manufacturingYear: 2024,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      engineCapacity: 1498,
      vehicleValue: 1100000,
      mileage: 16.0,
      registrationState: 'MH'
    },
    insurance_details: {
      policyType: 'Comprehensive',
      policyDuration: '1 Year',
      premiumAmount: 21000,
      policyStartDate: '2025-02-01',
      policyEndDate: '2026-02-01',
      noClaimBonus: 10,
      previousClaims: 0,
      coverageAmount: 1000000,
      insuranceCompany: 'InsureAI General Insurance'
    },
    driver_details: {
      drivingExperience: 5,
      licenseValidity: 'Valid',
      trafficViolations: 0,
      accidentHistory: 0,
      drivingScore: 82
    },
    accident_details: {
      accidentType: 'Minor Damage',
      repairCost: 24000,
      date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      location: 'Western Express Highway, Mumbai',
      policeReport: 'No',
      hospitalization: 'No',
      thirdPartyDamage: 'No',
      weatherCondition: 'Rainy',
      description: 'Minor bumper scrape while maneuvering in heavy rain.'
    },
    documents: [
      { id: 'doc-3', type: 'Insurance Policy', name: 'honda_policy.pdf', size: 150000, dataUrl: '', uploaded_at: new Date().toISOString() }
    ],
    timeline: [
      { status: 'submitted', label: 'Claim Submitted', description: 'Claim submitted for officer review.', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), completed: true },
      { status: 'prediction', label: 'AI Prediction', description: 'XGBoost model completed analysis.', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), completed: true },
      { status: 'verification', label: 'Document Verification', description: 'Awaiting officer verification.', timestamp: '', completed: false },
      { status: 'review', label: 'Officer Review', description: 'Awaiting officer final decision.', timestamp: '', completed: false },
      { status: 'completed', label: 'Completed', description: 'Final decision pending.', timestamp: '', completed: false }
    ],
    admin_remarks: null,
    reviewed_by: null,
    reviewed_at: null
  }
];

const INITIAL_SAMPLE_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-91mcf0xw',
    claim_id: 'claim-91mcf0xw',
    user_id: 'cust-krishnaprasad',
    prediction: 'Claim Likely',
    confidence: 89,
    risk_level: 'Low',
    probability_approved: 89,
    probability_rejected: 11,
    feature_importance: [
      { feature: 'drivingScore', label: 'High Driving Score', importance: 0.35, direction: 'positive', value: '88' },
      { feature: 'noClaimBonus', label: 'No Claim Bonus Active', importance: 0.25, direction: 'positive', value: '20%' },
      { feature: 'previousClaims', label: 'Zero Prior Claims', importance: 0.20, direction: 'positive', value: '0' }
    ],
    model_version: 'xgboost-v1.0',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'pred-nph8gbet',
    claim_id: 'claim-nph8gbet',
    user_id: 'cust-rahul',
    prediction: 'Claim Likely',
    confidence: 78,
    risk_level: 'Low',
    probability_approved: 78,
    probability_rejected: 22,
    feature_importance: [
      { feature: 'drivingScore', label: 'Good Driving Score', importance: 0.30, direction: 'positive', value: '82' },
      { feature: 'repairCost', label: 'Reasonable Repair Cost', importance: 0.25, direction: 'positive', value: '₹24,000' }
    ],
    model_version: 'xgboost-v1.0',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

/**
 * Helper to test if a string is a valid UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (val?: string): boolean => !!val && UUID_REGEX.test(val);

/**
 * Get all local claims from localStorage
 */
export function getLocalClaims(): Claim[] {
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
    let list: Claim[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
    // Ensure initial sample claims exist in list
    const existingIds = new Set(list.map((c) => c.id || c.claim_number));
    let modified = false;
    for (const sample of INITIAL_SAMPLE_CLAIMS) {
      if (!existingIds.has(sample.id) && !existingIds.has(sample.claim_number)) {
        list.push(sample);
        modified = true;
      }
    }
    if (modified || !raw) {
      localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    console.error('Error reading local claims:', e);
    return INITIAL_SAMPLE_CLAIMS;
  }
}

/**
 * Get all local predictions from localStorage
 */
export function getLocalPredictions(): Prediction[] {
  try {
    const raw = localStorage.getItem(PREDICTIONS_STORAGE_KEY);
    let list: Prediction[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
    // Ensure initial sample predictions exist in list
    const existingKeys = new Set(list.map((p) => p.claim_id || p.id));
    let modified = false;
    for (const sample of INITIAL_SAMPLE_PREDICTIONS) {
      if (!existingKeys.has(sample.claim_id) && !existingKeys.has(sample.id)) {
        list.push(sample);
        modified = true;
      }
    }
    if (modified || !raw) {
      localStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    console.error('Error reading local predictions:', e);
    return INITIAL_SAMPLE_PREDICTIONS;
  }
}

/**
 * Save claim to local storage and trigger sync event
 */
export function saveLocalClaim(claim: Claim) {
  try {
    const existing = getLocalClaims();
    const index = existing.findIndex((c) => c.id === claim.id || c.claim_number === claim.claim_number);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...claim };
    } else {
      existing.unshift(claim);
    }
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event('insureai_claims_updated'));
  } catch (e) {
    console.error('Error saving local claim:', e);
  }
}

/**
 * Save prediction to local storage and trigger sync event
 */
export function saveLocalPrediction(pred: Prediction) {
  try {
    const existing = getLocalPredictions();
    const index = existing.findIndex((p) => p.id === pred.id || p.claim_id === pred.claim_id);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...pred };
    } else {
      existing.unshift(pred);
    }
    localStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event('insureai_predictions_updated'));
  } catch (e) {
    console.error('Error saving local prediction:', e);
  }
}

/**
 * Merge Supabase claims with local claims store (deduplicated by claim_number / id)
 */
export async function fetchAllClaimsMerged(userId?: string, isOfficer = false): Promise<Claim[]> {
  let dbClaims: Claim[] = [];
  try {
    let query = supabase.from('claims').select('*');
    if (!isOfficer && userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (data && !error) {
      dbClaims = data as Claim[];
    }
  } catch (e) {
    console.error('Error fetching claims from Supabase:', e);
  }

  const localClaims = getLocalClaims();

  // Filter local claims by user if not officer (also include sample claims for testing)
  const filteredLocal = (!isOfficer && userId)
    ? localClaims.filter((c) => c.user_id === userId || c.claim_number === 'CLM-91MCF0XW' || c.claim_number === 'CLM-NPH8GBET')
    : localClaims;

  const map: Record<string, Claim> = {};

  // Reconcile status helper
  const reconcile = (c: Claim): Claim => {
    let dec = c.company_decision || 'Pending';
    let stat = c.status || 'pending';
    if (dec === 'Approved' || stat === 'approved') {
      dec = 'Approved';
      stat = 'approved';
    } else if (dec === 'Rejected' || stat === 'rejected') {
      dec = 'Rejected';
      stat = 'rejected';
    } else if (dec === 'More Information Required' || stat === 'under_review') {
      dec = 'More Information Required';
      stat = 'under_review';
    }
    return { ...c, company_decision: dec, status: stat as any };
  };

  // First put local claims
  filteredLocal.forEach((c) => {
    const key = c.id || c.claim_number;
    const reconciled = reconcile(c);
    if (key) map[key] = reconciled;
    if (c.claim_number) map[c.claim_number] = reconciled;
  });

  // Merge DB claims into map
  dbClaims.forEach((c) => {
    const key = c.id || c.claim_number;
    const existing = map[key] || (c.claim_number ? map[c.claim_number] : undefined);
    
    let dec = c.company_decision || existing?.company_decision || 'Pending';
    let stat = c.status || existing?.status || 'pending';
    if (dec === 'Approved' || stat === 'approved') {
      dec = 'Approved';
      stat = 'approved';
    } else if (dec === 'Rejected' || stat === 'rejected') {
      dec = 'Rejected';
      stat = 'rejected';
    } else if (dec === 'More Information Required' || stat === 'under_review') {
      dec = 'More Information Required';
      stat = 'under_review';
    }

    if (existing) {
      const merged: Claim = {
        ...existing,
        ...c,
        company_decision: dec,
        status: stat as any,
        admin_remarks: c.admin_remarks || existing.admin_remarks || null,
        personal_info: { ...existing.personal_info, ...c.personal_info },
        vehicle_details: { ...existing.vehicle_details, ...c.vehicle_details },
        insurance_details: { ...existing.insurance_details, ...c.insurance_details },
        driver_details: { ...existing.driver_details, ...c.driver_details },
        accident_details: { ...existing.accident_details, ...c.accident_details },
      };
      map[c.id] = merged;
      if (c.claim_number) map[c.claim_number] = merged;
    } else {
      const rec = reconcile(c);
      map[c.id] = rec;
      if (c.claim_number) map[c.claim_number] = rec;
    }
  });

  // Deduplicate array values by unique ID
  const uniqueClaimsMap: Record<string, Claim> = {};
  Object.values(map).forEach((c) => {
    if (c && c.id) {
      uniqueClaimsMap[c.id] = c;
    }
  });

  const mergedList = Object.values(uniqueClaimsMap).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return mergedList;
}

/**
 * Merge Supabase predictions with local predictions store
 */
export async function fetchAllPredictionsMerged(userId?: string, isOfficer = false): Promise<Prediction[]> {
  let dbPreds: Prediction[] = [];
  try {
    let query = supabase.from('predictions').select('*');
    if (!isOfficer && userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (data && !error) {
      dbPreds = data as Prediction[];
    }
  } catch (e) {
    console.error('Error fetching predictions from Supabase:', e);
  }

  const localPreds = getLocalPredictions();
  const filteredLocal = (!isOfficer && userId)
    ? localPreds.filter((p) => p.user_id === userId || p.claim_id === 'claim-91mcf0xw' || p.claim_id === 'claim-nph8gbet')
    : localPreds;

  const map: Record<string, Prediction> = {};
  filteredLocal.forEach((p) => {
    const key = p.claim_id || p.id;
    if (key) map[key] = p;
  });

  dbPreds.forEach((p) => {
    const key = p.claim_id || p.id;
    if (key) {
      map[key] = { ...map[key], ...p };
    }
  });

  const uniquePredsMap: Record<string, Prediction> = {};
  Object.values(map).forEach((p) => {
    if (p && p.id) {
      uniquePredsMap[p.id] = p;
    }
  });

  return Object.values(uniquePredsMap).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Fetch a single claim merged by ID or claim_number
 */
export async function fetchSingleClaimMerged(idOrNumber: string): Promise<Claim | null> {
  if (!idOrNumber) return null;
  const allMerged = await fetchAllClaimsMerged(undefined, true);
  const found = allMerged.find((c) => c.id === idOrNumber || c.claim_number === idOrNumber);
  if (found) return found;

  try {
    if (isUuid(idOrNumber)) {
      const { data, error } = await supabase.from('claims').select('*').eq('id', idOrNumber).maybeSingle();
      if (data && !error) return data as Claim;
    } else {
      const { data, error } = await supabase.from('claims').select('*').eq('claim_number', idOrNumber).maybeSingle();
      if (data && !error) return data as Claim;
    }
  } catch (e) {
    console.error('Error fetching single claim from Supabase:', e);
  }

  return null;
}

/**
 * Fetch a single prediction merged by claimId or claimNumber
 */
export async function fetchSinglePredictionMerged(claimIdOrNumber: string, claimNumber?: string): Promise<Prediction | null> {
  if (!claimIdOrNumber && !claimNumber) return null;
  const allPreds = await fetchAllPredictionsMerged(undefined, true);
  const found = allPreds.find(
    (p) =>
      p.claim_id === claimIdOrNumber ||
      p.id === claimIdOrNumber ||
      (claimNumber && (p.claim_id === claimNumber || p.id === claimNumber))
  );
  if (found) return found;

  try {
    if (isUuid(claimIdOrNumber)) {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .or(`claim_id.eq.${claimIdOrNumber},id.eq.${claimIdOrNumber}`)
        .maybeSingle();
      if (data && !error) return data as Prediction;
    }
    if (claimNumber && isUuid(claimNumber)) {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('claim_id', claimNumber)
        .maybeSingle();
      if (data && !error) return data as Prediction;
    }
  } catch (e) {
    console.error('Error fetching single prediction from Supabase:', e);
  }

  return null;
}

/**
 * Update claim decision across DB and local store
 */
export async function syncClaimDecision(
  claimId: string,
  claimNumber: string,
  newDecision: 'Approved' | 'Rejected' | 'More Information Required',
  newStatus: 'approved' | 'rejected' | 'under_review',
  remarks: string,
  officerId: string,
  timeline: any[]
) {
  const now = new Date().toISOString();

  // Update DB
  const { error } = await supabase
    .from('claims')
    .update({
      status: newStatus,
      admin_remarks: remarks,
      reviewed_by: officerId,
      reviewed_at: now,
      timeline,
    })
    .eq('id', claimId);

  if (error) {
    console.warn('Supabase DB update notice:', error.message);
  }

  // Update in-memory initial sample claims if matching
  INITIAL_SAMPLE_CLAIMS.forEach((c) => {
    if (c.id === claimId || c.claim_number === claimNumber) {
      c.company_decision = newDecision;
      c.status = newStatus;
      c.admin_remarks = remarks;
      c.reviewed_by = officerId;
      c.reviewed_at = now;
      c.timeline = timeline;
    }
  });

  // Update local storage
  const local = getLocalClaims();
  const index = local.findIndex((c) => c.id === claimId || c.claim_number === claimNumber);
  if (index >= 0) {
    local[index] = {
      ...local[index],
      company_decision: newDecision,
      status: newStatus,
      admin_remarks: remarks,
      rejection_reason: newDecision === 'Rejected' ? remarks : null,
      officer_message: newDecision === 'More Information Required' ? remarks : null,
      reviewed_by: officerId,
      reviewed_at: now,
      timeline,
      updated_at: now,
    };
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(local));
  } else {
    saveLocalClaim({
      id: claimId,
      claim_number: claimNumber,
      company_decision: newDecision,
      status: newStatus,
      admin_remarks: remarks,
      reviewed_by: officerId,
      reviewed_at: now,
      timeline,
      updated_at: now,
    } as any);
  }

  window.dispatchEvent(new Event('insureai_claims_updated'));
  return { error: null };
}
