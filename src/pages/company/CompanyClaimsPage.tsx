import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Eye } from 'lucide-react';
import { supabase, type Claim, type Prediction, type Profile } from '../../lib/supabase';
import { fetchAllClaimsMerged, fetchAllPredictionsMerged } from '../../lib/claimsSync';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

export function CompanyClaimsPage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  // Filter & Search state
  const [search, setSearch] = useState('');
  const [aiFilter, setAiFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const sortOrder = 'newest';

  const loadData = async () => {
    const [claimsList, predList, { data: profilesData }] = await Promise.all([
      fetchAllClaimsMerged(undefined, true),
      fetchAllPredictionsMerged(undefined, true),
      supabase.from('profiles').select('*'),
    ]);
    setClaims(claimsList);
    setPredictions(predList);

    const profMap: Record<string, Profile> = {};
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

  // Filtering logic
  const filteredClaims = claims.filter((claim) => {
    const pred = predMap[claim.id];
    const profile = profiles[claim.user_id];
    const customerName = profile?.full_name || claim.personal_info?.fullName || '';
    const vehicle = `${claim.vehicle_details?.vehicleBrand || ''} ${claim.vehicle_details?.vehicleModel || ''}`;
    const claimNum = claim.claim_number || '';

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = claimNum.toLowerCase().includes(q);
      const matchCust = customerName.toLowerCase().includes(q);
      const matchVeh = vehicle.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchVeh) return false;
    }

    // AI Prediction filter
    if (aiFilter) {
      if (!pred || pred.prediction !== aiFilter) return false;
    }

    // Risk level filter
    if (riskFilter) {
      if (!pred || pred.risk_level !== riskFilter) return false;
    }

    // Company decision filter
    if (decisionFilter) {
      const currentDecision = claim.company_decision || 'Pending';
      if (currentDecision !== decisionFilter) return false;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Insurance Claims</h1>
        <p className="text-gray-500 text-sm mt-1">Search, filter, and inspect submitted claims and XGBoost predictions.</p>
      </div>

      {/* Filter controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Claim ID, customer, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>

          {/* AI Prediction Filter */}
          <select
            value={aiFilter}
            onChange={(e) => setAiFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="">All AI Predictions</option>
            <option value="Approved">AI Approved</option>
            <option value="Rejected">AI Rejected</option>
          </select>

          {/* Risk Filter */}
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

          {/* Company Decision Filter */}
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          >
            <option value="">All Company Decisions</option>
            <option value="Pending">Pending Decision</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="More Information Required">More Info Required</option>
          </select>
        </div>
      </Card>

      {/* Claims List Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredClaims.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 font-medium">
                <tr>
                  <th className="p-4">Claim ID</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Vehicle Details</th>
                  <th className="p-4">AI Prediction</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Company Decision</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredClaims.map((claim) => {
                  const pred = predMap[claim.id];
                  const profile = profiles[claim.user_id];
                  const custName = profile?.full_name || claim.personal_info?.fullName || 'Customer';
                  const decision = claim.company_decision || 'Pending';

                  return (
                    <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="p-4 font-semibold text-primary-600 dark:text-primary-400">{claim.claim_number}</td>
                      <td className="p-4 font-medium">{custName}</td>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/company/claims/${claim.id}`)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Button>
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
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-lg">No matching claims found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search query or filters.</p>
        </Card>
      )}
    </div>
  );
}
