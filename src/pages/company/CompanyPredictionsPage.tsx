import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Search, Eye } from 'lucide-react';
import { supabase, type Claim, type Prediction, type Profile } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDateTime } from '../../lib/utils';

import { fetchAllClaimsMerged, fetchAllPredictionsMerged } from '../../lib/claimsSync';

export function CompanyPredictionsPage() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [claims, setClaims] = useState<Record<string, Claim>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [predFilter, setPredFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');

  useEffect(() => {
    (async () => {
      const [predList, claimsList, { data: profilesData }] = await Promise.all([
        fetchAllPredictionsMerged(undefined, true),
        fetchAllClaimsMerged(undefined, true),
        supabase.from('profiles').select('*'),
      ]);

      setPredictions(predList);

      const cMap: Record<string, Claim> = {};
      if (claimsList) claimsList.forEach((c) => { cMap[c.id] = c; cMap[c.claim_number] = c; });
      setClaims(cMap);

      const pMap: Record<string, Profile> = {};
      if (profilesData) (profilesData as Profile[]).forEach((p) => { pMap[p.id] = p; });
      setProfiles(pMap);

      setLoading(false);
    })();
  }, []);

  const filteredPredictions = predictions.filter((pred) => {
    const claim = claims[pred.claim_id];
    const profile = profiles[pred.user_id];
    const claimNum = claim?.claim_number || '';
    const custName = profile?.full_name || claim?.personal_info?.fullName || '';

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!claimNum.toLowerCase().includes(q) && !custName.toLowerCase().includes(q)) {
        return false;
      }
    }

    // AI Prediction filter
    if (predFilter && pred.prediction !== predFilter) return false;

    // Risk filter
    if (riskFilter && pred.risk_level !== riskFilter) return false;

    // Decision filter
    if (decisionFilter) {
      const dec = claim?.company_decision || 'Pending';
      if (dec !== decisionFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-primary-600" />
          <h1 className="text-2xl font-bold">XGBoost AI Prediction Logs</h1>
        </div>
        <p className="text-gray-500 text-sm">Review real model inference logs, risk levels, and confidence probabilities.</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Claim ID / Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>

          <select
            value={predFilter}
            onChange={(e) => setPredFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="">All AI Predictions</option>
            <option value="Approved">No Claim (Approved)</option>
            <option value="Rejected">Claim Likely (Rejected)</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="">All Company Decisions</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="More Information Required">More Info Required</option>
          </select>
        </div>
      </Card>

      {/* Predictions Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPredictions.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 font-medium">
                <tr>
                  <th className="p-4">Claim ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">AI Outcome</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Model Version</th>
                  <th className="p-4">Company Decision</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredPredictions.map((pred) => {
                  const claim = claims[pred.claim_id];
                  const profile = profiles[pred.user_id];
                  const custName = profile?.full_name || claim?.personal_info?.fullName || 'Customer';
                  const decision = claim?.company_decision || 'Pending';

                  return (
                    <tr key={pred.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="p-4 font-semibold text-primary-600 dark:text-primary-400">{claim?.claim_number || '—'}</td>
                      <td className="p-4 font-medium">{custName}</td>
                      <td className="p-4">
                        <Badge variant={pred.prediction === 'Claim Likely' ? 'success' : 'danger'}>
                          {pred.prediction === 'Claim Likely' ? 'No Claim' : 'Claim Likely'}
                        </Badge>
                      </td>
                      <td className="p-4 font-bold">{pred.confidence}%</td>
                      <td className="p-4">
                        <Badge variant={pred.risk_level === 'Low' ? 'success' : pred.risk_level === 'High' ? 'danger' : 'warning'}>
                          {pred.risk_level} Risk
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-500">{pred.model_version || 'xgboost-v1.0'}</td>
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
                      <td className="p-4 text-xs text-gray-500">{formatDateTime(pred.created_at)}</td>
                      <td className="p-4 text-right">
                        {claim && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/company/claims/${claim.id}`)}>
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-lg">No prediction records found</p>
        </Card>
      )}
    </div>
  );
}
