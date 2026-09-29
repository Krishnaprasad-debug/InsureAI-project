import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, ShieldCheck, AlertTriangle, Brain, Search, Filter
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { type Claim, type Prediction, type Profile, supabase } from '../../lib/supabase';
import { fetchAllClaimsMerged, fetchAllPredictionsMerged } from '../../lib/claimsSync';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export function CompanyAnalyticsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterClaimId, setFilterClaimId] = useState('');
  const [filterPrediction, setFilterPrediction] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterDecision, setFilterDecision] = useState('All');

  useEffect(() => {
    (async () => {
      const [claimsList, predList, { data: profileList }] = await Promise.all([
        fetchAllClaimsMerged(undefined, true),
        fetchAllPredictionsMerged(undefined, true),
        supabase.from('profiles').select('*')
      ]);
      
      const profileMap: Record<string, Profile> = {};
      if (profileList) {
        profileList.forEach(p => { profileMap[p.id] = p; });
      }
      
      setClaims(claimsList);
      setPredictions(predList);
      setProfiles(profileMap);
      setLoading(false);
    })();
  }, []);

  const predMap = useMemo(() => {
    const map: Record<string, Prediction> = {};
    predictions.forEach(p => { map[p.claim_id] = p; });
    return map;
  }, [predictions]);

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const p = predMap[c.id];
      const prof = profiles[c.user_id];
      const custName = (prof?.full_name || c.personal_info?.fullName || 'Customer').toLowerCase();
      const cId = c.claim_number.toLowerCase();
      const dec = c.company_decision || 'Pending';

      if (filterCustomer && !custName.includes(filterCustomer.toLowerCase())) return false;
      if (filterClaimId && !cId.includes(filterClaimId.toLowerCase())) return false;
      if (filterPrediction !== 'All' && p?.prediction !== filterPrediction) return false;
      if (filterRisk !== 'All' && p?.risk_level !== filterRisk) return false;
      if (filterDecision !== 'All' && dec !== filterDecision) return false;

      return true;
    });
  }, [claims, predMap, profiles, filterCustomer, filterClaimId, filterPrediction, filterRisk, filterDecision]);

  const filteredPredictions = predictions.filter(p => filteredClaims.some(c => c.id === p.claim_id));

  const aiPredictionData = (() => {
    const counts: Record<string, number> = { 'Claim Likely': 0, 'Claim Unlikely': 0 };
    filteredPredictions.forEach((p) => {
      const label = p.prediction === 'Claim Likely' ? 'Claim Likely' : 'Claim Unlikely';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const riskLevelData = (() => {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
    filteredPredictions.forEach((p) => {
      if (counts[p.risk_level] !== undefined) counts[p.risk_level]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: `${name} Risk`, value }));
  })();

  const decisionData = (() => {
    const counts: Record<string, number> = {
      Approved: 0,
      Rejected: 0,
      Pending: 0,
      'More Info Needed': 0,
    };
    filteredClaims.forEach((c) => {
      const d = c.company_decision || 'Pending';
      const key = d === 'More Information Required' ? 'More Info Needed' : d;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const timelineData = (() => {
    const months: Record<string, { month: string; claims: number; approved: number; rejected: number }> = {};
    filteredClaims.forEach((c) => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (!months[key]) months[key] = { month: key, claims: 0, approved: 0, rejected: 0 };
      months[key].claims++;
      if (c.company_decision === 'Approved' || c.status === 'approved') months[key].approved++;
      if (c.company_decision === 'Rejected' || c.status === 'rejected') months[key].rejected++;
    });
    return Object.values(months);
  })();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Company Analytics</h1>
          <p className="text-slate-500 mt-1">Real-time claim tracking and AI performance metrics.</p>
        </div>
      </div>

      <Card className="bg-white">
        <CardBody className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-secondary-500" />
            <h3 className="font-semibold text-slate-800">Filter Analytics</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input 
              label="Customer Name" 
              name="filterCustomer"
              placeholder="e.g. Krishnan" 
              value={filterCustomer} 
              onChange={e => setFilterCustomer(e.target.value)} 
              icon={<Search className="w-4 h-4"/>} 
            />
            <Input 
              label="Claim ID" 
              name="filterClaimId"
              placeholder="e.g. CLM-..." 
              value={filterClaimId} 
              onChange={e => setFilterClaimId(e.target.value)} 
            />
            <Select 
              label="AI Prediction" 
              name="filterPrediction"
              value={filterPrediction} 
              onChange={e => setFilterPrediction(e.target.value)}
              options={[{value: 'All', label: 'All Predictions'}, {value: 'Claim Likely', label: 'Claim Likely'}, {value: 'Claim Unlikely', label: 'Claim Unlikely'}]}
            />
            <Select 
              label="Risk Level" 
              name="filterRisk"
              value={filterRisk} 
              onChange={e => setFilterRisk(e.target.value)}
              options={[{value: 'All', label: 'All Risks'}, {value: 'Low', label: 'Low'}, {value: 'Medium', label: 'Medium'}, {value: 'High', label: 'High'}]}
            />
            <Select 
              label="Company Decision" 
              name="filterDecision"
              value={filterDecision} 
              onChange={e => setFilterDecision(e.target.value)}
              options={[{value: 'All', label: 'All Decisions'}, {value: 'Pending', label: 'Pending'}, {value: 'Approved', label: 'Approved'}, {value: 'Rejected', label: 'Rejected'}, {value: 'More Information Required', label: 'More Info'}]}
            />
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Claims Filtered" value={filteredClaims.length.toString()} icon={<BarChart3 className="w-5 h-5" />} color="primary" />
            <StatCard label="Model Inferences" value={filteredPredictions.length.toString()} icon={<Brain className="w-5 h-5" />} color="secondary" />
            <StatCard label="High Risk Claims" value={filteredPredictions.filter(p => p.risk_level === 'High').length.toString()} icon={<AlertTriangle className="w-5 h-5" />} color="danger" />
            <StatCard label="Approved Claims" value={filteredClaims.filter(c => c.company_decision === 'Approved').length.toString()} icon={<ShieldCheck className="w-5 h-5" />} color="primary" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Traceability: Claims & AI Predictions</CardTitle>
            </CardHeader>
            <CardBody className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Claim ID & Date</th>
                    <th className="p-4 font-semibold">Vehicle</th>
                    <th className="p-4 font-semibold">AI Prediction</th>
                    <th className="p-4 font-semibold">Risk Level</th>
                    <th className="p-4 font-semibold">Company Decision</th>
                    <th className="p-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.length > 0 ? (
                    filteredClaims.map(claim => {
                      const prof = profiles[claim.user_id];
                      const pred = predMap[claim.id];
                      const custName = prof?.full_name || claim.personal_info?.fullName || 'Unknown';
                      const email = prof?.email || claim.personal_info?.email || 'N/A';
                      const date = new Date(claim.created_at).toLocaleDateString();
                      
                      return (
                        <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{custName}</div>
                            <div className="text-xs text-slate-500">{email}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-primary-600">{claim.claim_number}</div>
                            <div className="text-xs text-slate-500">{date}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-700">
                            {claim.vehicle_details?.vehicleBrand} {claim.vehicle_details?.vehicleModel}
                          </td>
                          <td className="p-4">
                            {pred ? (
                              <Badge variant={pred.prediction === 'Claim Likely' ? 'primary' : 'warning'}>
                                {pred.prediction} ({pred.confidence}%)
                              </Badge>
                            ) : <span className="text-xs text-slate-400">N/A</span>}
                          </td>
                          <td className="p-4">
                            {pred ? (
                              <Badge variant={pred.risk_level === 'Low' ? 'success' : pred.risk_level === 'Medium' ? 'warning' : 'danger'}>
                                {pred.risk_level} Risk
                              </Badge>
                            ) : <span className="text-xs text-slate-400">N/A</span>}
                          </td>
                          <td className="p-4">
                            <Badge variant={claim.company_decision === 'Approved' ? 'success' : claim.company_decision === 'Rejected' ? 'danger' : 'warning'}>
                              {claim.company_decision || 'Pending'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Link to={`/company/claims/${claim.id}`} className="text-sm text-secondary-600 hover:text-secondary-800 font-medium">
                              Review
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">No claims match the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>1. Claims by AI Prediction</CardTitle></CardHeader>
              <CardBody>
                {aiPredictionData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={aiPredictionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No prediction records found</div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>2. Claims by Risk Level</CardTitle></CardHeader>
              <CardBody>
                {riskLevelData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={riskLevelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="opacity-50" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No risk data recorded yet</div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>3. Company Decisions</CardTitle></CardHeader>
              <CardBody>
                {decisionData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={decisionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                        {decisionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No decision records found</div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>4. Claims Over Time</CardTitle></CardHeader>
              <CardBody>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="opacity-50" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="claims" name="Total Claims" stroke="#9333ea" strokeWidth={2} />
                      <Line type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No timeline data available</div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
