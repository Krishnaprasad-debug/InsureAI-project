import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Car, Shield, ShipWheel, AlertTriangle, FileText, CheckCircle2,
  XCircle, ChevronLeft, Brain, Download, HelpCircle, AlertCircle,
  Building2
} from 'lucide-react';
import { supabase, type Claim, type Prediction, type Profile, type CompanyDecision } from '../../lib/supabase';
import { syncClaimDecision, fetchSingleClaimMerged, fetchSinglePredictionMerged } from '../../lib/claimsSync';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { formatDateTime, formatBytes } from '../../lib/utils';

export function CompanyClaimDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [customerProfile, setCustomerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Decision Modal States
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'request_info';
  }>({ open: false, type: 'approve' });

  const [reasonInput, setReasonInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [c, pred] = await Promise.all([
        fetchSingleClaimMerged(id),
        fetchSinglePredictionMerged(id),
      ]);

      if (c) {
        setClaim(c);
        if (c.user_id) {
          const { data: custData } = await supabase.from('profiles').select('*').eq('id', c.user_id).maybeSingle();
          setCustomerProfile(custData as Profile | null);
        }
      }
      setPrediction(pred);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Claim not found</p>
        <Button onClick={() => navigate('/company/claims')}>Back to Claims</Button>
      </div>
    );
  }

  const currentDecision: CompanyDecision = claim.company_decision || 'Pending';

  const handleApplyDecision = async () => {
    if (!profile?.id) return;
    setSubmitting(true);
    const now = new Date().toISOString();

    let newCompanyDecision: CompanyDecision = 'Approved';
    let newStatus: 'approved' | 'rejected' | 'under_review' = 'approved';
    let remarksText = '';

    if (decisionModal.type === 'approve') {
      newCompanyDecision = 'Approved';
      newStatus = 'approved';
      remarksText = 'Claim approved by Insurance Officer.';
    } else if (decisionModal.type === 'reject') {
      if (!reasonInput.trim()) {
        toast('error', 'Reason Required', 'Please provide a reason for claim rejection.');
        setSubmitting(false);
        return;
      }
      newCompanyDecision = 'Rejected';
      newStatus = 'rejected';
      remarksText = reasonInput;
    } else if (decisionModal.type === 'request_info') {
      if (!reasonInput.trim()) {
        toast('error', 'Message Required', 'Please provide a message explaining what information is needed.');
        setSubmitting(false);
        return;
      }
      newCompanyDecision = 'More Information Required';
      newStatus = 'under_review';
      remarksText = reasonInput;
    }

    const updatedTimeline = (claim.timeline || []).map((t) => {
      if (newStatus === 'approved' || newStatus === 'rejected') {
        if (t.status === 'verification' || t.status === 'review' || t.status === 'completed') {
          return { ...t, completed: true, timestamp: t.timestamp || now };
        }
      }
      return t;
    });

    const { error } = await syncClaimDecision(
      claim.id,
      claim.claim_number,
      newCompanyDecision,
      newStatus,
      remarksText,
      profile.id,
      updatedTimeline
    );

    if (error) {
      toast('error', 'Decision failed', typeof error === 'string' ? error : (error as any)?.message || 'Action failed');
    } else {
      let notifMessage = '';
      if (newCompanyDecision === 'Approved') notifMessage = `Your insurance claim ${claim.claim_number} has been approved.`;
      else if (newCompanyDecision === 'Rejected') notifMessage = `Your insurance claim ${claim.claim_number} has been rejected.\nReason: ${remarksText}`;
      else notifMessage = `More information is required for your claim ${claim.claim_number}.\nMessage: ${remarksText}`;
      
      // Notify customer
      try {
        await supabase.from('notifications').insert({
          user_id: claim.user_id,
          title: `Claim ${newCompanyDecision}`,
          message: notifMessage,
          type: newCompanyDecision === 'Approved' ? 'success' : newCompanyDecision === 'Rejected' ? 'danger' : 'warning',
        });
      } catch (notifErr) {
        console.warn('Customer notification notice:', notifErr);
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: claim.user_id,
        action: `company_decision_${newCompanyDecision.toLowerCase().replace(/\s+/g, '_')}`,
        entity_type: 'claim',
        entity_id: claim.id,
        details: { decision: newCompanyDecision, remarks: remarksText, officer_id: profile.id },
      });

      toast('success', 'Decision Recorded', `Claim decision set to ${newCompanyDecision}.`);
      setClaim({
        ...claim,
        company_decision: newCompanyDecision,
        status: newStatus,
        admin_remarks: remarksText,
        reviewed_by: profile.id,
        reviewed_at: now,
      });
      setDecisionModal({ open: false, type: 'approve' });
      setReasonInput('');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back & Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 mb-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Claims List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Claim Review: {claim.claim_number}</h1>
            <Badge
              variant={
                currentDecision === 'Approved' ? 'success' :
                currentDecision === 'Rejected' ? 'danger' :
                currentDecision === 'More Information Required' ? 'warning' : 'outline'
              }
            >
              Officer Decision: {currentDecision}
            </Badge>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Submitted: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatDateTime(claim.created_at)}</span>
        </div>
      </div>

      {/* Main Grid: AI Prediction & Company Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real AI Prediction Card (XGBoost Output) */}
        <Card className="lg:col-span-1 border-2 border-primary-500/20 bg-gradient-to-br from-primary-950/10 to-transparent">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-600" />
              <CardTitle>AI Recommendation (XGBoost)</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 p-5">
            {prediction ? (
              <>
                <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Model Output</p>
                  <p className={`text-2xl font-bold ${prediction.prediction === 'Claim Likely' ? 'text-primary-600' : 'text-danger-600'}`}>
                    {prediction.prediction === 'Claim Likely' ? 'No Claim (Unlikely)' : 'Claim Likely'}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant={prediction.risk_level === 'Low' ? 'success' : prediction.risk_level === 'High' ? 'danger' : 'warning'}>
                      {prediction.risk_level} Risk
                    </Badge>
                    <Badge variant="outline">{prediction.model_version || 'xgboost-v1.0'}</Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confidence Score:</span>
                    <span className="font-bold">{prediction.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approval Probability:</span>
                    <span className="font-semibold text-primary-600">{prediction.probability_approved}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rejection Probability:</span>
                    <span className="font-semibold text-danger-600">{prediction.probability_rejected}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span>Analyzed At:</span>
                    <span>{formatDateTime(prediction.created_at)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">No stored AI prediction record</div>
            )}
          </CardBody>
        </Card>

        {/* Company Final Decision Action Bar */}
        <Card className="lg:col-span-2 border-2 border-primary-600">
          <CardHeader className="bg-primary-600 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <CardTitle className="text-white">Insurance Officer Final Decision</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              The AI prediction above is a recommendation. As an authorized insurance officer, review the complete claim details and record the official final company decision below.
            </p>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 font-medium">Current Final Decision:</span>
              <Badge
                variant={
                  currentDecision === 'Approved' ? 'success' :
                  currentDecision === 'Rejected' ? 'danger' :
                  currentDecision === 'More Information Required' ? 'warning' : 'outline'
                }
                className="text-sm px-3 py-1"
              >
                {currentDecision}
              </Badge>
              {claim.reviewed_at && (
                <span className="text-xs text-gray-400 ml-auto">Reviewed on {formatDateTime(claim.reviewed_at)}</span>
              )}
            </div>

            {claim.admin_remarks && (
              <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-sm">
                <span className="font-semibold text-primary-700 dark:text-primary-300">Officer Remarks / Message:</span>
                <p className="text-gray-700 dark:text-gray-300 mt-1">{claim.admin_remarks}</p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                variant="primary"
                className="bg-primary-600 hover:bg-primary-700 text-white flex-1"
                onClick={() => setDecisionModal({ open: true, type: 'approve' })}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Claim
              </Button>

              <Button
                variant="outline"
                className="border-danger-500 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex-1"
                onClick={() => setDecisionModal({ open: true, type: 'reject' })}
              >
                <XCircle className="w-4 h-4" />
                Reject Claim
              </Button>

              <Button
                variant="outline"
                className="border-warning-500 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 flex-1"
                onClick={() => setDecisionModal({ open: true, type: 'request_info' })}
              >
                <HelpCircle className="w-4 h-4" />
                Request Information
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Claim Detail Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              <CardTitle>Customer Information</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <DetailRow label="Full Name" value={claim.personal_info?.fullName || customerProfile?.full_name} />
            <DetailRow label="Age" value={claim.personal_info?.age} />
            <DetailRow label="Gender" value={claim.personal_info?.gender} />
            <DetailRow label="Occupation" value={claim.personal_info?.occupation || customerProfile?.occupation} />
            <DetailRow label="Annual Income" value={claim.personal_info?.annualIncome ? `$${Number(claim.personal_info.annualIncome).toLocaleString()}` : null} />
            <DetailRow label="City" value={claim.personal_info?.city} />
            <DetailRow label="State" value={claim.personal_info?.state} />
            <DetailRow label="PIN Code" value={claim.personal_info?.pinCode} />
          </CardBody>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary-600" />
              <CardTitle>Vehicle Details</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <DetailRow label="Vehicle Type" value={claim.vehicle_details?.vehicleType} />
            <DetailRow label="Brand / Make" value={claim.vehicle_details?.vehicleBrand} />
            <DetailRow label="Model" value={claim.vehicle_details?.vehicleModel} />
            <DetailRow label="Manufacturing Year" value={claim.vehicle_details?.manufacturingYear} />
            <DetailRow label="Vehicle Age" value={claim.vehicle_details?.vehicleAge ? `${claim.vehicle_details.vehicleAge} years` : null} />
            <DetailRow label="Fuel Type" value={claim.vehicle_details?.fuelType} />
            <DetailRow label="Transmission" value={claim.vehicle_details?.transmission} />
            <DetailRow label="Engine Capacity" value={claim.vehicle_details?.engineCapacity ? `${claim.vehicle_details.engineCapacity} cc` : null} />
            <DetailRow label="Estimated Value" value={claim.vehicle_details?.vehicleValue ? `$${Number(claim.vehicle_details.vehicleValue).toLocaleString()}` : null} />
            <DetailRow label="Mileage" value={claim.vehicle_details?.mileage ? `${claim.vehicle_details.mileage} km/l` : null} />
          </CardBody>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              <CardTitle>Insurance Policy</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <DetailRow label="Policy Type" value={claim.insurance_details?.policyType} />
            <DetailRow label="Policy Duration" value={claim.insurance_details?.policyDuration} />
            <DetailRow label="Premium Amount" value={claim.insurance_details?.premiumAmount ? `$${Number(claim.insurance_details.premiumAmount).toLocaleString()}` : null} />
            <DetailRow label="Coverage Amount" value={claim.insurance_details?.coverageAmount ? `$${Number(claim.insurance_details.coverageAmount).toLocaleString()}` : null} />
            <DetailRow label="No Claim Bonus" value={claim.insurance_details?.noClaimBonus ? `${claim.insurance_details.noClaimBonus}%` : null} />
            <DetailRow label="Previous Claims" value={claim.insurance_details?.previousClaims} />
            <DetailRow label="Insurance Provider" value={claim.insurance_details?.insuranceCompany} />
            <DetailRow label="Start Date" value={claim.insurance_details?.policyStartDate} />
            <DetailRow label="End Date" value={claim.insurance_details?.policyEndDate} />
          </CardBody>
        </Card>

        {/* Driver Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShipWheel className="w-5 h-5 text-primary-600" />
              <CardTitle>Driver Profile</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <DetailRow label="Driving Experience" value={claim.driver_details?.drivingExperience ? `${claim.driver_details.drivingExperience} years` : null} />
            <DetailRow label="License Validity" value={claim.driver_details?.licenseValidity} />
            <DetailRow label="Traffic Violations" value={claim.driver_details?.trafficViolations} />
            <DetailRow label="Accident History" value={claim.driver_details?.accidentHistory} />
            <DetailRow label="Driving Score" value={claim.driver_details?.drivingScore ? `${claim.driver_details.drivingScore} / 100` : null} />
          </CardBody>
        </Card>
      </div>

      {/* Accident Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            <CardTitle>Accident Details</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DetailRow label="Accident Type" value={claim.accident_details?.accidentType} />
            <DetailRow label="Accident Date" value={claim.accident_details?.date} />
            <DetailRow label="Repair Cost" value={claim.accident_details?.repairCost ? `$${Number(claim.accident_details.repairCost).toLocaleString()}` : null} />
            <DetailRow label="Police Report Filed" value={claim.accident_details?.policeReport} />
            <DetailRow label="Hospitalization Required" value={claim.accident_details?.hospitalization} />
            <DetailRow label="Third Party Damage" value={claim.accident_details?.thirdPartyDamage} />
            <DetailRow label="Weather Condition" value={claim.accident_details?.weatherCondition} />
            <DetailRow label="Location" value={claim.accident_details?.location} />
          </div>
          {claim.accident_details?.description && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-gray-500 font-medium block mb-1">Accident Description:</span>
              <p className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl text-gray-700 dark:text-gray-300">{claim.accident_details.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Verification Documents ({claim.documents?.length || 0})</CardTitle>
        </CardHeader>
        <CardBody>
          {claim.documents && claim.documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {claim.documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-primary-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.type} · {formatBytes(doc.size)}</p>
                    </div>
                  </div>
                  {doc.dataUrl && (
                    <a
                      href={doc.dataUrl}
                      download={doc.name}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 hover:bg-primary-100 shrink-0"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No documents uploaded with this claim</p>
          )}
        </CardBody>
      </Card>

      {/* Decision Action Modal */}
      <Modal
        open={decisionModal.open}
        onClose={() => setDecisionModal({ open: false, type: 'approve' })}
        title={
          decisionModal.type === 'approve' ? 'Confirm Claim Approval' :
          decisionModal.type === 'reject' ? 'Reject Claim' : 'Request Additional Information'
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {decisionModal.type === 'approve'
              ? `Are you sure you want to approve claim ${claim.claim_number}? This will record your final approval decision in Supabase.`
              : decisionModal.type === 'reject'
              ? `Please enter the official reason for rejecting claim ${claim.claim_number}.`
              : `Please specify what additional documents or information are needed for claim ${claim.claim_number}.`}
          </p>

          {decisionModal.type !== 'approve' && (
            <Textarea
              label={decisionModal.type === 'reject' ? 'Rejection Reason' : 'Officer Message'}
              rows={3}
              placeholder={decisionModal.type === 'reject' ? 'Enter detailed reason for rejection...' : 'Enter message for policyholder...'}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDecisionModal({ open: false, type: 'approve' })} disabled={submitting}>
              Cancel
            </Button>
            <Button
              loading={submitting}
              className={decisionModal.type === 'reject' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-primary-600'}
              onClick={handleApplyDecision}
            >
              Confirm Decision
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800/40 last:border-0">
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-800 dark:text-gray-200">{value !== undefined && value !== null && value !== '' ? String(value) : '—'}</span>
    </div>
  );
}
