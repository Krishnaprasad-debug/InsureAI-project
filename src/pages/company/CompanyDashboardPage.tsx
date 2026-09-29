import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle2, XCircle,
  Brain, AlertTriangle, ShieldCheck, Building2, ArrowRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { type Claim, type Prediction } from '../../lib/supabase';
import { fetchAllClaimsMerged, fetchAllPredictionsMerged } from '../../lib/claimsSync';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export function CompanyDashboardPage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [claimsList, predList] = await Promise.all([
      fetchAllClaimsMerged(undefined, true),
      fetchAllPredictionsMerged(undefined, true),
    ]);
    setClaims(claimsList);
    setPredictions(predList);
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

  // Compute real statistics from database
  const totalClaims = claims.length;

  const claimLikelyCount = predictions.filter((p) => p.prediction === 'Claim Unlikely' || p.probability_rejected >= 50).length;
  const noClaimCount = predictions.filter((p) => p.prediction === 'Claim Likely' || p.probability_approved >= 50).length;

  const highRiskCount = predictions.filter((p) => p.risk_level === 'High').length;
  const medRiskCount = predictions.filter((p) => p.risk_level === 'Medium').length;
  const lowRiskCount = predictions.filter((p) => p.risk_level === 'Low').length;

  const pendingReviewCount = claims.filter((c) => !c.company_decision || c.company_decision === 'Pending' || c.status === 'pending' || c.status === 'under_review').length;
  const approvedCount = claims.filter((c) => c.company_decision === 'Approved' || c.status === 'approved').length;
  const rejectedCount = claims.filter((c) => c.company_decision === 'Rejected' || c.status === 'rejected').length;
  const moreInfoCount = claims.filter((c) => c.company_decision === 'More Information Required').length;

  const recentClaims = claims.slice(0, 6);

  // Map predictions to claim ID for quick lookup
  const predMap: Record<string, Prediction> = {};
  predictions.forEach((p) => { predMap[p.claim_id] = p; });

  const aiDistributionData = [
    { name: 'Claim Likely (High Risk)', value: claimLikelyCount },
    { name: 'No Claim (Low Risk)', value: noClaimCount },
  ].filter((d) => d.value > 0);

  const decisionDistributionData = [
    { name: 'Approved', value: approvedCount },
    { name: 'Rejected', value: rejectedCount },
    { name: 'Pending Review', value: pendingReviewCount },
    { name: 'More Info Needed', value: moreInfoCount },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-primary-600" />
            <h1 className="text-2xl font-bold">Insurance Officer Dashboard</h1>
          </div>
          <p className="text-gray-500 text-sm">Review claims, analyze real XGBoost predictions, and make final decisions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/company/pending"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-md shadow-primary-600/20"
          >
            <Clock className="w-4 h-4" />
            Pending Queue ({pendingReviewCount})
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Claims Received" value={totalClaims} icon={<FileText className="w-5 h-5" />} color="primary" />
            <StatCard label="Pending Review" value={pendingReviewCount} icon={<Clock className="w-5 h-5" />} color="warning" />
            <StatCard label="Approved Decisions" value={approvedCount} icon={<CheckCircle2 className="w-5 h-5" />} color="accent" />
            <StatCard label="Rejected Decisions" value={rejectedCount} icon={<XCircle className="w-5 h-5" />} color="danger" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">AI High Risk Claims</p>
                  <p className="text-2xl font-bold mt-1 text-danger-400">{highRiskCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-danger-500/20 flex items-center justify-center text-danger-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">AI Medium Risk Claims</p>
                  <p className="text-2xl font-bold mt-1 text-warning-400">{medRiskCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-warning-500/20 flex items-center justify-center text-warning-400">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">AI Low Risk Claims</p>
                  <p className="text-2xl font-bold mt-1 text-primary-400">{lowRiskCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Analytics overview charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Prediction Overview (XGBoost)</CardTitle>
          </CardHeader>
          <CardBody>
            {aiDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={aiDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">No predictions recorded yet</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Decisions Breakout</CardTitle>
          </CardHeader>
          <CardBody>
            {decisionDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={decisionDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {decisionDistributionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">No company decisions recorded yet</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Claims Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Submitted Claims</CardTitle>
            <Link to="/company/claims" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All Claims <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {recentClaims.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 font-medium">
                <tr>
                  <th className="p-4">Claim ID</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">AI Prediction</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Company Decision</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {recentClaims.map((claim) => {
                  const pred = predMap[claim.id];
                  const decision = claim.company_decision || 'Pending';
                  return (
                    <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="p-4 font-semibold">{claim.claim_number}</td>
                      <td className="p-4">{claim.vehicle_details?.vehicleBrand || '—'} {claim.vehicle_details?.vehicleModel || ''}</td>
                      <td className="p-4">
                        {pred ? (
                          <Badge variant={pred.prediction === 'Claim Likely' ? 'success' : 'danger'}>
                            {pred.prediction} ({pred.confidence}%)
                          </Badge>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-4">
                        {pred ? (
                          <Badge variant={pred.risk_level === 'Low' ? 'success' : pred.risk_level === 'High' ? 'danger' : 'warning'}>
                            {pred.risk_level} Risk
                          </Badge>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            decision === 'Approved' ? 'success' :
                            decision === 'Rejected' ? 'danger' :
                            decision === 'More Information Required' ? 'warning' : 'outline'
                          }
                        >
                          {decision}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-500">{formatDate(claim.created_at)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate(`/company/claims/${claim.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-xs font-semibold transition-colors"
                        >
                          Review Claim
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-400">No claims submitted yet</div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
