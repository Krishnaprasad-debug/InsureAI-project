import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Search, Download, Plus, ChevronLeft, ChevronRight,
  Clock, CheckCircle2, XCircle, Eye, Brain,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { type Claim } from '../lib/supabase';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/Misc';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { formatDate, downloadFile } from '../lib/utils';

const PAGE_SIZE = 8;

import { fetchAllClaimsMerged, fetchSingleClaimMerged, fetchAllPredictionsMerged, fetchSinglePredictionMerged } from '../lib/claimsSync';

export function getEffectiveStatus(claim: Claim): 'pending' | 'under_review' | 'approved' | 'rejected' {
  if (claim.company_decision === 'Approved' || claim.status === 'approved') return 'approved';
  if (claim.company_decision === 'Rejected' || claim.status === 'rejected') return 'rejected';
  if (claim.company_decision === 'More Information Required' || claim.status === 'under_review') return 'under_review';
  return (claim.status as any) || 'pending';
}

export function ClaimHistoryPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [predictionsMap, setPredictionsMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [page, setPage] = useState(0);

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      const [list, preds] = await Promise.all([
        fetchAllClaimsMerged(profile.id, false),
        fetchAllPredictionsMerged(profile.id, false),
      ]);
      setClaims(list);
      const pMap: Record<string, boolean> = {};
      preds.forEach((p) => {
        if (p.claim_id) pMap[p.claim_id] = true;
        if (p.id) pMap[p.id] = true;
      });
      setPredictionsMap(pMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => { loadData(); };
    window.addEventListener('insureai_claims_updated', handleSync);
    window.addEventListener('insureai_predictions_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('insureai_claims_updated', handleSync);
      window.removeEventListener('insureai_predictions_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [profile?.id]);

  const filtered = useMemo(() => {
    let result = claims;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.claim_number.toLowerCase().includes(q) ||
        (c.vehicle_details?.vehicleBrand || '').toLowerCase().includes(q) ||
        (c.vehicle_details?.vehicleModel || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (sortBy === 'status') {
      const order = { pending: 0, under_review: 1, approved: 2, rejected: 3 };
      result = [...result].sort((a, b) => order[a.status] - order[b.status]);
    }
    return result;
  }, [claims, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ['Claim Number', 'Status', 'Vehicle', 'Created Date'];
    const rows = filtered.map((c) => [
      c.claim_number,
      c.status,
      `${c.vehicle_details?.vehicleBrand || ''} ${c.vehicle_details?.vehicleModel || ''}`,
      formatDate(c.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    downloadFile(csv, 'claims-export.csv', 'text/csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Claim History</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage all your submitted claims.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={claims.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => navigate('/claims/new')}>
            <Plus className="w-4 h-4" />
            New Claim
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by claim number or vehicle..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            >
              <option value="date">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Claims list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : paged.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paged.map((claim, i) => (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{claim.claim_number}</p>
                      <p className="text-xs text-gray-500">{formatDate(claim.created_at)}</p>
                    </div>
                  </div>
                  <StatusBadge status={getEffectiveStatus(claim)} />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle</span>
                    <span className="font-medium">{claim.vehicle_details?.vehicleBrand || '—'} {claim.vehicle_details?.vehicleModel || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Accident Type</span>
                    <span className="font-medium">{claim.accident_details?.accidentType || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documents</span>
                    <span className="font-medium">{claim.documents?.length || 0} files</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to={`/claims/${claim.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </Button>
                  </Link>
                  {(() => {
                    const hasPred = Boolean(
                      predictionsMap[claim.id] ||
                      (claim.claim_number && predictionsMap[claim.claim_number])
                    );
                    return (
                      <Link to={`/claims/${claim.id}/result`} className="flex-1">
                        <Button
                          size="sm"
                          variant={hasPred ? 'primary' : 'outline'}
                          className={`w-full ${!hasPred ? 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300' : ''}`}
                        >
                          <Brain className="w-3.5 h-3.5" />
                          {hasPred ? 'Prediction' : 'Prediction Unavailable'}
                        </Button>
                      </Link>
                    );
                  })()}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No claims found</p>
            <Button size="sm" onClick={() => navigate('/claims/new')}>
              <Plus className="w-4 h-4" />
              Submit your first claim
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [hasPrediction, setHasPrediction] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const data = await fetchSingleClaimMerged(id);
      setClaim(data);
      if (data) {
        const pred = await fetchSinglePredictionMerged(data.id, data.claim_number);
        setHasPrediction(Boolean(pred));
      }
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
        <p className="text-gray-500 mb-4">Claim not found</p>
        <Button onClick={() => navigate('/claims')}>Back to Claims</Button>
      </div>
    );
  }

  const sections = [
    { label: 'Personal Information', icon: '👤', data: claim.personal_info, fields: ['fullName', 'age', 'gender', 'occupation', 'annualIncome', 'city', 'state', 'pinCode'] },
    { label: 'Vehicle Details', icon: '🚗', data: claim.vehicle_details, fields: ['vehicleType', 'vehicleBrand', 'vehicleModel', 'vehicleAge', 'manufacturingYear', 'fuelType', 'engineCapacity', 'transmission', 'vehicleValue', 'mileage', 'registrationState'] },
    { label: 'Insurance Details', icon: '🛡️', data: claim.insurance_details, fields: ['policyType', 'policyDuration', 'premiumAmount', 'policyStartDate', 'policyEndDate', 'noClaimBonus', 'previousClaims', 'coverageAmount', 'insuranceCompany'] },
    { label: 'Driver Details', icon: '🪪', data: claim.driver_details, fields: ['drivingExperience', 'licenseValidity', 'trafficViolations', 'accidentHistory', 'drivingScore'] },
    { label: 'Accident Details', icon: '⚠️', data: claim.accident_details, fields: ['accidentType', 'repairCost', 'date', 'location', 'policeReport', 'hospitalization', 'thirdPartyDamage', 'weatherCondition', 'description'] },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate('/claims')} className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 mb-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Claims
          </button>
          <h1 className="text-2xl font-bold">{claim.claim_number}</h1>
          <p className="text-sm text-gray-500 mt-1">Submitted on {formatDate(claim.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={getEffectiveStatus(claim)} />
          <Link to={`/claims/${claim.id}/result`}>
            <Button
              size="sm"
              variant={hasPrediction ? 'primary' : 'outline'}
              className={!hasPrediction ? 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300' : ''}
            >
              <Brain className="w-3.5 h-3.5" />
              {hasPrediction ? 'View Prediction' : 'Prediction Unavailable'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Officer Decision Banner */}
      {claim.status === 'approved' || claim.company_decision === 'Approved' ? (
        <Card className="bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent border-2 border-primary-500/50 p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400">Claim Approved by Insurance Officer</h3>
                <Badge variant="success">Official Approval</Badge>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Your insurance claim has been officially reviewed and <strong>APPROVED</strong> by the Insurance Company.
              </p>
              {claim.admin_remarks && (
                <div className="mt-3 p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-primary-200 dark:border-primary-900/40 text-sm">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Officer Remarks: </span>
                  <span className="text-gray-700 dark:text-gray-300">{claim.admin_remarks}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : claim.status === 'rejected' || claim.company_decision === 'Rejected' ? (
        <Card className="bg-gradient-to-r from-danger-500/10 via-danger-500/5 to-transparent border-2 border-danger-500/50 p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-danger-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-danger-500/30">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-danger-700 dark:text-danger-400">Claim Rejected by Insurance Officer</h3>
                <Badge variant="danger">Decision Recorded</Badge>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Your insurance claim has been reviewed and rejected by the Insurance Company.
              </p>
              {claim.admin_remarks && (
                <div className="mt-3 p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-danger-200 dark:border-danger-900/40 text-sm">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Rejection Reason: </span>
                  <span className="text-gray-700 dark:text-gray-300">{claim.admin_remarks}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Timeline */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-6">Claim Timeline</h3>
          <div className="relative">
            {claim.timeline?.map((entry, i) => {
              const Icon = entry.status === 'submitted' ? FileText :
                entry.status === 'prediction' ? Brain :
                entry.status === 'verification' ? Eye :
                entry.status === 'review' ? Clock :
                entry.status === 'completed' ? (claim.status === 'approved' ? CheckCircle2 : XCircle) : Clock;
              return (
                <div key={i} className="flex gap-4 pb-8 last:pb-0 relative">
                  {i < claim.timeline.length - 1 && (
                    <div className={`absolute left-5 top-12 bottom-0 w-0.5 ${entry.completed ? 'bg-primary-300 dark:bg-primary-700' : 'bg-gray-200 dark:bg-gray-800'}`} />
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${entry.completed ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{entry.label}</p>
                      {entry.completed && entry.timestamp && (
                        <span className="text-xs text-gray-400">{formatDate(entry.timestamp)}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{entry.description}</p>
                    {!entry.completed && (
                      <span className="inline-flex items-center gap-1 text-xs text-warning-500 mt-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Claim details sections */}
      {sections.map((section) => (
        <Card key={section.label}>
          <CardBody>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">{section.icon}</span>
              {section.label}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {section.fields.map((field) => (
                <div key={field}>
                  <p className="text-xs text-gray-400 capitalize">{field.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-sm font-medium">{(section.data as any)?.[field] || '—'}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}

      {/* Documents */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Uploaded Documents ({claim.documents?.length || 0})</h3>
          {claim.documents && claim.documents.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {claim.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No documents uploaded</p>
          )}
        </CardBody>
      </Card>

      {claim.company_decision && (
        <Card className={`border-l-4 ${claim.company_decision === 'Approved' ? 'border-l-primary-500' : claim.company_decision === 'Rejected' ? 'border-l-danger-500' : 'border-l-warning-500'}`}>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Insurance Company Final Decision</h3>
              <Badge variant={claim.company_decision === 'Approved' ? 'success' : claim.company_decision === 'Rejected' ? 'danger' : 'warning'}>
                {claim.company_decision}
              </Badge>
            </div>
            {claim.admin_remarks && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Officer Remarks: </span>
                {claim.admin_remarks}
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {claim.admin_remarks && !claim.company_decision && (
        <Card>
          <CardBody>
            <h3 className="font-semibold mb-2">Officer Remarks</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{claim.admin_remarks}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}


