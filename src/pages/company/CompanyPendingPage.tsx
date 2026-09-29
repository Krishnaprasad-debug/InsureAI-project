import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, CheckCircle2, Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase, type Claim, type Prediction, type Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { predictClaim } from '../../lib/prediction';
import { fetchAllClaimsMerged, fetchAllPredictionsMerged, saveLocalClaim, saveLocalPrediction } from '../../lib/claimsSync';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatCurrency } from '../../lib/utils';

const TEST_CUSTOMER_ID = '379b91fc-63b9-45b8-9e31-1b48a811abd5';
const TEST_CUSTOMER_EMAIL = 'rahul.sharma@insureai.com';
const TEST_CUSTOMER_NAME = 'Rahul Sharma';

export function CompanyPendingPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    const [claimsList, predList, { data: profilesData }] = await Promise.all([
      fetchAllClaimsMerged(undefined, true),
      fetchAllPredictionsMerged(undefined, true),
      supabase.from('profiles').select('*'),
    ]);
    setClaims(claimsList);
    setPredictions(predList);

    const profMap: Record<string, Profile> = {
      [TEST_CUSTOMER_ID]: {
        id: TEST_CUSTOMER_ID,
        email: TEST_CUSTOMER_EMAIL,
        full_name: TEST_CUSTOMER_NAME,
        role: 'customer',
        phone: '+91 98765 43210',
        avatar_url: null,
        occupation: 'Software Engineer',
        annual_income: 85000,
        city: 'Mumbai',
        state: 'Maharashtra',
        pin_code: '400001',
        date_of_birth: '1990-05-15',
        notification_settings: { email: true, push: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    if (profilesData) {
      (profilesData as Profile[]).forEach((p) => { profMap[p.id] = p; });
    }
    setProfiles(profMap);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const handleSync = () => { loadData(); };
    window.addEventListener('insureai_claims_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('insureai_claims_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const predMap: Record<string, Prediction> = {};
  predictions.forEach((p) => { predMap[p.claim_id] = p; });

  const pendingClaims = claims.filter((c) => !c.company_decision || c.company_decision === 'Pending' || c.status === 'pending' || c.status === 'under_review');

  const handleGenerateTestClaim = async () => {
    if (!profile?.id || generating) return;
    setGenerating(true);

    const testClaimNum = `CLM-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const samplePersonal = {
      fullName: TEST_CUSTOMER_NAME,
      age: 34,
      gender: 'Male',
      occupation: 'Software Engineer',
      annualIncome: 85000,
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
    };
    const sampleVehicle = {
      vehicleType: 'Sedan',
      vehicleBrand: 'Honda',
      vehicleModel: 'City',
      manufacturingYear: 2021,
      vehicleAge: 3,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      engineCapacity: 1498,
      vehicleValue: 18000,
      mileage: 16.5,
      registrationState: 'MH',
    };
    const sampleInsurance = {
      policyType: 'Comprehensive',
      policyDuration: '1 Year',
      premiumAmount: 650,
      policyStartDate: '2025-01-01',
      policyEndDate: '2026-01-01',
      noClaimBonus: 20,
      previousClaims: 0,
      coverageAmount: 20000,
      insuranceCompany: 'InsureAI General Insurance',
    };
    const sampleDriver = {
      drivingExperience: 8,
      licenseValidity: 'Valid',
      trafficViolations: 0,
      accidentHistory: 0,
      drivingScore: 88,
    };
    const sampleAccident = {
      accidentType: 'Collision',
      date: '2026-02-15',
      repairCost: 3200,
      location: 'Mumbai Western Express Highway',
      policeReport: 'Yes',
      hospitalization: 'No',
      thirdPartyDamage: 'No',
      weatherCondition: 'Clear',
      description: 'Minor bumper collision while changing lanes during heavy traffic.',
    };

    const timeline = [
      { status: 'submitted', label: 'Claim Submitted', description: 'Claim submitted for review.', timestamp: now, completed: true },
      { status: 'prediction', label: 'AI Prediction', description: 'XGBoost model completed analysis.', timestamp: now, completed: true },
      { status: 'verification', label: 'Document Verification', description: 'Awaiting officer verification.', timestamp: '', completed: false },
      { status: 'review', label: 'Officer Review', description: 'Awaiting officer final decision.', timestamp: '', completed: false },
      { status: 'completed', label: 'Completed', description: 'Final decision pending.', timestamp: '', completed: false },
    ];

    const customerProfileObj: Profile = {
      id: TEST_CUSTOMER_ID,
      email: TEST_CUSTOMER_EMAIL,
      full_name: TEST_CUSTOMER_NAME,
      role: 'customer',
      phone: '+91 98765 43210',
      avatar_url: null,
      occupation: 'Software Engineer',
      annual_income: 85000,
      city: 'Mumbai',
      state: 'Maharashtra',
      pin_code: '400001',
      date_of_birth: '1990-05-15',
      notification_settings: { email: true, push: true },
      created_at: now,
      updated_at: now,
    };

    try {
      const prediction = await predictClaim({
        personal: samplePersonal,
        vehicle: sampleVehicle,
        insurance: sampleInsurance,
        driver: sampleDriver,
        accident: sampleAccident,
      });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      let createdClaim: Claim | null = null;
      let createdPred: Prediction | null = null;

      try {
        const customerClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: authData } = await customerClient.auth.signInWithPassword({
          email: TEST_CUSTOMER_EMAIL,
          password: 'Customer@2026!',
        });

        if (authData?.user) {
          const { data: claimData, error: claimErr } = await customerClient
            .from('claims')
            .insert({
              user_id: authData.user.id,
              claim_number: testClaimNum,
              status: 'pending',
              personal_info: samplePersonal,
              vehicle_details: sampleVehicle,
              insurance_details: sampleInsurance,
              driver_details: sampleDriver,
              accident_details: sampleAccident,
              documents: [],
              timeline,
            })
            .select()
            .single();

          if (claimErr) {
            console.warn('Customer DB insert notice:', claimErr.message);
          } else if (claimData) {
            createdClaim = {
              ...claimData,
              company_decision: 'Pending',
            };

            const { data: predData, error: predErr } = await customerClient
              .from('predictions')
              .insert({
                claim_id: claimData.id,
                user_id: authData.user.id,
                prediction: prediction.prediction,
                confidence: prediction.confidence,
                risk_level: prediction.risk_level,
                probability_approved: prediction.probability_approved,
                probability_rejected: prediction.probability_rejected,
                feature_importance: prediction.feature_importance,
                model_version: prediction.model_version,
              })
              .select()
              .single();

            if (!predErr && predData) {
              createdPred = predData;
            }
          }
        }
      } catch (clientErr) {
        console.warn('Isolated customer client error, proceeding with local sync:', clientErr);
      }

      if (!createdClaim) {
        const claimId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `claim-${Math.random().toString(36).substring(2, 10)}`;
        createdClaim = {
          id: claimId,
          user_id: TEST_CUSTOMER_ID,
          claim_number: testClaimNum,
          status: 'pending',
          company_decision: 'Pending',
          personal_info: samplePersonal,
          vehicle_details: sampleVehicle,
          insurance_details: sampleInsurance,
          driver_details: sampleDriver,
          accident_details: sampleAccident,
          documents: [],
          timeline,
          admin_remarks: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: now,
          updated_at: now,
        };
      }

      if (!createdPred) {
        const predId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pred-${Math.random().toString(36).substring(2, 10)}`;
        createdPred = {
          id: predId,
          claim_id: createdClaim.id,
          user_id: TEST_CUSTOMER_ID,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          risk_level: prediction.risk_level,
          probability_approved: prediction.probability_approved,
          probability_rejected: prediction.probability_rejected,
          feature_importance: prediction.feature_importance,
          model_version: prediction.model_version,
          created_at: now,
        };
      }

      saveLocalClaim(createdClaim);
      saveLocalPrediction(createdPred);

      setProfiles((prev) => ({
        ...prev,
        [TEST_CUSTOMER_ID]: customerProfileObj,
      }));

      setClaims((prev) => [createdClaim!, ...prev.filter((c) => c.id !== createdClaim!.id && c.claim_number !== createdClaim!.claim_number)]);
      if (createdPred) {
        setPredictions((prev) => [createdPred!, ...prev.filter((p) => p.claim_id !== createdClaim!.id)]);
      }

      try {
        await supabase.from('notifications').insert({
          user_id: profile.id,
          title: 'New Test Claim Received',
          message: `Customer: ${samplePersonal.fullName}\nClaim ID: ${testClaimNum}\nAI Prediction: ${prediction.prediction}\nRisk: ${prediction.risk_level}`,
          type: 'info',
        });
      } catch (notifErr) {
        console.warn('Officer notification notice:', notifErr);
      }

      toast('success', 'Test Claim Created', `Claim ${testClaimNum} added for officer review.`);
    } catch (err: any) {
      toast('error', 'Error creating test claim', err.message || 'Operation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-warning-500" />
            <h1 className="text-2xl font-bold">Pending Officer Reviews</h1>
          </div>
          <p className="text-gray-500 text-sm">Claims awaiting final officer review and decision.</p>
        </div>
        <Button onClick={handleGenerateTestClaim} variant="outline" size="sm" loading={generating} disabled={generating}>
          <Plus className="w-4 h-4 mr-1.5" />
          Generate Test Claim
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pendingClaims.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingClaims.map((claim, i) => {
            const pred = predMap[claim.id];
            const profileItem = profiles[claim.user_id];
            const custName = profileItem?.full_name || claim.personal_info?.fullName || 'Customer';

            return (
              <motion.div key={claim.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card hover className="p-5 border-l-4 border-l-warning-500">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-base text-primary-600 dark:text-primary-400">{claim.claim_number}</p>
                      <p className="text-xs text-gray-500">Submitted {formatDate(claim.created_at)}</p>
                    </div>
                    <Badge variant="warning">Pending Review</Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-medium truncate max-w-[150px]">{custName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle</span>
                      <span className="font-medium">{claim.vehicle_details?.vehicleBrand || '—'} {claim.vehicle_details?.vehicleModel || ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Repair Cost</span>
                      <span className="font-medium">{claim.accident_details?.repairCost ? formatCurrency(claim.accident_details.repairCost) : '—'}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <span className="text-xs text-gray-500">AI Recommendation:</span>
                      {pred ? (
                        <Badge variant={pred.prediction === 'Claim Likely' ? 'success' : 'danger'}>
                          {pred.prediction} ({pred.confidence}%)
                        </Badge>
                      ) : <span className="text-xs text-gray-400">Not run</span>}
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => navigate(`/company/claims/${claim.id}`)}>
                    <Eye className="w-4 h-4" />
                    Review Claim Details
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-primary-500 mx-auto mb-3" />
          <p className="font-semibold text-lg">No pending reviews</p>
          <p className="text-gray-500 text-sm mt-1 mb-4">All submitted claims have been reviewed by officers.</p>
          <Button onClick={handleGenerateTestClaim} variant="outline" className="mx-auto" loading={generating} disabled={generating}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Sample Claim for Testing
          </Button>
        </Card>
      )}
    </div>
  );
}
