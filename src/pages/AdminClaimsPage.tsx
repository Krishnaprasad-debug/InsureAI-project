import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, FileText, Brain, CheckCircle2, XCircle, Clock, Eye,
  TrendingUp, TrendingDown, AlertCircle,
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { supabase, type Claim, type Prediction, type Profile } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/Misc';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Input';
import { formatDate, formatDateTime, initials } from '../lib/utils';

export function AdminClaimsPage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('claims')
        .select('*')
        .order('created_at', { ascending: false });
      setClaims(data as Claim[] || []);
      setLoading(false);
    })();
  }, []);

  const filtered = statusFilter ? claims.filter((c) => c.status === statusFilter) : claims;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Claims</h1>
          <p className="text-gray-500 text-sm mt-1">Review and process all customer claims.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((claim, i) => (
            <motion.div key={claim.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hover className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{claim.claim_number}</p>
                      <p className="text-xs text-gray-500">{formatDate(claim.created_at)}</p>
                    </div>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle</span>
                    <span className="font-medium">{claim.vehicle_details?.vehicleBrand || '—'} {claim.vehicle_details?.vehicleModel || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Accident</span>
                    <span className="font-medium">{claim.accident_details?.accidentType || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Repair Cost</span>
                    <span className="font-medium">${claim.accident_details?.repairCost || '—'}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/admin/claims/${claim.id}`)}>
                  <Eye className="w-3.5 h-3.5" />
                  Review Claim
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No claims found</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export function AdminClaimReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [actionModal, setActionModal] = useState<{ open: boolean; action: 'approve' | 'reject' | 'under_review' }>({ open: false, action: 'approve' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: claimData }, { data: predData }] = await Promise.all([
        supabase.from('claims').select('*').eq('id', id).maybeSingle(),
        supabase.from('predictions').select('*').eq('claim_id', id).maybeSingle(),
      ]);
      const claim = claimData as Claim | null;
      if (claim) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', claim.user_id).maybeSingle();
        setUserProfile(profile as Profile | null);
        setRemarks(claim.admin_remarks || '');
      }
      setClaim(claim);
      setPrediction(predData as Prediction | null);
      setLoading(false);
    })();
  }, [id]);

  const handleAction = async () => {
    if (!claim) return;
    setProcessing(true);
    const newStatus = actionModal.action === 'approve' ? 'approved' : actionModal.action === 'reject' ? 'rejected' : 'under_review';
    const now = new Date().toISOString();

    const updatedTimeline = claim.timeline?.map((t) => {
      if (newStatus === 'approved' || newStatus === 'rejected') {
        if (t.status === 'verification' || t.status === 'review' || t.status === 'completed') {
          return { ...t, completed: true, timestamp: t.timestamp || now };
        }
      }
      if (newStatus === 'under_review' && t.status === 'verification') {
        return { ...t, completed: true, timestamp: t.timestamp || now };
      }
      return t;
    });

    const { error } = await supabase
      .from('claims')
      .update({
        status: newStatus,
        admin_remarks: remarks,
        reviewed_at: now,
        timeline: updatedTimeline,
      })
      .eq('id', claim.id);

    if (error) {
      toast('error', 'Action failed', error.message);
    } else {
      // Notify user
      await supabase.from('notifications').insert({
        user_id: claim.user_id,
        title: `Claim ${newStatus === 'approved' ? 'Approved' : newStatus === 'rejected' ? 'Rejected' : 'Under Review'}`,
        message: `Your claim ${claim.claim_number} has been ${newStatus.replace('_', ' ')}.`,
        type: newStatus === 'approved' ? 'success' : newStatus === 'rejected' ? 'error' : 'info',
      });

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: claim.user_id,
        action: `claim_${newStatus}`,
        entity_type: 'claim',
        entity_id: claim.id,
        details: { remarks },
      });

      toast('success', `Claim ${newStatus}`, `Claim has been ${newStatus.replace('_', ' ')}.`);
      setClaim({ ...claim, status: newStatus as any, admin_remarks: remarks });
      setActionModal({ open: false, action: 'approve' });
    }
    setProcessing(false);
  };

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
        <Button onClick={() => navigate('/admin/claims')}>Back to Claims</Button>
      </div>
    );
  }

  const gaugeData = prediction ? [{ name: 'confidence', value: prediction.confidence, fill: prediction.prediction === 'Approved' ? '#10b981' : '#ef4444' }] : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate('/admin/claims')} className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 mb-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Claims
          </button>
          <h1 className="text-2xl font-bold">{claim.claim_number}</h1>
          <p className="text-sm text-gray-500 mt-1">Submitted by {userProfile?.full_name || 'Unknown'} on {formatDate(claim.created_at)}</p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* Customer + AI Prediction summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                {initials(userProfile?.full_name)}
              </div>
              <div>
                <p className="font-medium">{userProfile?.full_name}</p>
                <p className="text-xs text-gray-500">{userProfile?.email}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{userProfile?.phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">City</span><span>{userProfile?.city || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Occupation</span><span>{userProfile?.occupation || '—'}</span></div>
            </div>
          </CardBody>
        </Card>

        {prediction && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI Prediction</CardTitle>
                <Badge variant="outline"><Brain className="w-3 h-3" />{prediction.model_version}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <ResponsiveContainer width="100%" height={120}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: '#e5e7eb' }} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="text-2xl font-bold -mt-8">{prediction.confidence}%</div>
                  <p className="text-xs text-gray-500 mt-1">Confidence</p>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    {prediction.prediction === 'Approved' ? (
                      <CheckCircle2 className="w-6 h-6 text-accent-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-danger-600" />
                    )}
                    <span className={`text-xl font-bold ${prediction.prediction === 'Approved' ? 'text-accent-600' : 'text-danger-600'}`}>
                      {prediction.prediction}
                    </span>
                    <Badge variant={prediction.risk_level === 'Low' ? 'success' : prediction.risk_level === 'High' ? 'danger' : 'warning'}>
                      {prediction.risk_level} Risk
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {prediction.feature_importance.slice(0, 4).map((f) => (
                      <div key={f.feature} className="flex items-center gap-2 text-sm">
                        {f.direction === 'positive' ? <TrendingUp className="w-4 h-4 text-accent-500" /> : <TrendingDown className="w-4 h-4 text-danger-500" />}
                        <span className="text-gray-600 dark:text-gray-400 flex-1">{f.label}</span>
                        <span className="font-medium">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Claim details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { label: 'Personal', data: claim.personal_info, fields: ['fullName', 'age', 'gender', 'occupation', 'annualIncome', 'city', 'state'] },
          { label: 'Vehicle', data: claim.vehicle_details, fields: ['vehicleType', 'vehicleBrand', 'vehicleModel', 'vehicleAge', 'fuelType', 'vehicleValue'] },
          { label: 'Insurance', data: claim.insurance_details, fields: ['policyType', 'premiumAmount', 'coverageAmount', 'previousClaims', 'noClaimBonus', 'insuranceCompany'] },
          { label: 'Accident', data: claim.accident_details, fields: ['accidentType', 'repairCost', 'date', 'location', 'policeReport', 'weatherCondition'] },
        ].map((section) => (
          <Card key={section.label}>
            <CardHeader><CardTitle>{section.label}</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {section.fields.map((field) => (
                  <div key={field}>
                    <p className="text-xs text-gray-400 capitalize">{field.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="font-medium">{(section.data as any)?.[field] || '—'}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Documents */}
      <Card>
        <CardHeader><CardTitle>Documents ({claim.documents?.length || 0})</CardTitle></CardHeader>
        <CardBody>
          {claim.documents && claim.documents.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {claim.documents.map((doc) => (
                <a key={doc.id} href={doc.dataUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <FileText className="w-8 h-8 text-primary-500" />
                  <p className="text-xs font-medium truncate w-full text-center">{doc.name}</p>
                  <p className="text-xs text-gray-400">{doc.type}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No documents uploaded</p>
          )}
        </CardBody>
      </Card>

      {/* Admin actions */}
      <Card>
        <CardHeader><CardTitle>Admin Review</CardTitle></CardHeader>
        <CardBody>
          <Textarea
            label="Remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add your review remarks..."
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setActionModal({ open: true, action: 'under_review' })}>
              <Clock className="w-4 h-4" />
              Mark Under Review
            </Button>
            <Button variant="success" onClick={() => setActionModal({ open: true, action: 'approve' })}>
              <CheckCircle2 className="w-4 h-4" />
              Approve Claim
            </Button>
            <Button variant="danger" onClick={() => setActionModal({ open: true, action: 'reject' })}>
              <XCircle className="w-4 h-4" />
              Reject Claim
            </Button>
          </div>
          {claim.reviewed_at && (
            <p className="mt-4 text-xs text-gray-400">
              Last reviewed on {formatDateTime(claim.reviewed_at)}
            </p>
          )}
        </CardBody>
      </Card>

      <Modal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, action: 'approve' })}
        title={actionModal.action === 'approve' ? 'Approve Claim' : actionModal.action === 'reject' ? 'Reject Claim' : 'Mark Under Review'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {actionModal.action === 'approve' && 'Are you sure you want to approve this claim? The customer will be notified.'}
            {actionModal.action === 'reject' && 'Are you sure you want to reject this claim? The customer will be notified.'}
            {actionModal.action === 'under_review' && 'Mark this claim as under review? The customer will be notified.'}
          </p>
          {remarks && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 mb-1">Remarks:</p>
              <p className="text-sm">{remarks}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setActionModal({ open: false, action: 'approve' })}>Cancel</Button>
            <Button
              variant={actionModal.action === 'approve' ? 'success' : actionModal.action === 'reject' ? 'danger' : 'primary'}
              className="flex-1"
              loading={processing}
              onClick={handleAction}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
