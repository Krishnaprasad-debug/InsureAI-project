import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Users, FileText, Clock, CheckCircle2, XCircle, TrendingUp, Activity,
  Target,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase, type Claim, type Prediction, type Profile } from '../lib/supabase';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Misc';
import { SkeletonCard } from '../components/ui/Skeleton';
import { timeAgo } from '../lib/utils';

const COLORS = ['#9333ea', '#10b981', '#f97316', '#ef4444'];

export function AdminDashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: claimsData }, { data: predData }, { data: usersData }] = await Promise.all([
        supabase.from('claims').select('*').order('created_at', { ascending: false }),
        supabase.from('predictions').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ]);
      setClaims(claimsData as Claim[] || []);
      setPredictions(predData as Prediction[] || []);
      setUsers(usersData as Profile[] || []);
      setLoading(false);
    })();
  }, []);

  const stats = {
    totalUsers: users.filter((u) => u.role === 'customer').length,
    totalClaims: claims.length,
    pendingClaims: claims.filter((c) => c.status === 'pending' || c.status === 'under_review').length,
    approvedClaims: claims.filter((c) => c.status === 'approved').length,
    rejectedClaims: claims.filter((c) => c.status === 'rejected').length,
    avgConfidence: predictions.length > 0
      ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100) / 100
      : 0,
  };

  const monthlyData = (() => {
    const months: Record<string, { month: string; claims: number; approved: number; rejected: number }> = {};
    claims.forEach((c) => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (!months[key]) months[key] = { month: key, claims: 0, approved: 0, rejected: 0 };
      months[key].claims++;
      if (c.status === 'approved') months[key].approved++;
      if (c.status === 'rejected') months[key].rejected++;
    });
    return Object.values(months).slice(-6);
  })();

  const statusData = [
    { name: 'Approved', value: stats.approvedClaims },
    { name: 'Rejected', value: stats.rejectedClaims },
    { name: 'Pending', value: stats.pendingClaims },
  ].filter((d) => d.value > 0);

  const vehicleTypeData = (() => {
    const types: Record<string, number> = {};
    claims.forEach((c) => {
      const t = c.vehicle_details?.vehicleType || 'Unknown';
      types[t] = (types[t] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  })();

  const recentActivity = claims.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and analytics.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} color="primary" />
          <StatCard label="Total Claims" value={stats.totalClaims} icon={<FileText className="w-5 h-5" />} color="secondary" />
          <StatCard label="Pending" value={stats.pendingClaims} icon={<Clock className="w-5 h-5" />} color="warning" />
          <StatCard label="Approved" value={stats.approvedClaims} icon={<CheckCircle2 className="w-5 h-5" />} color="accent" />
          <StatCard label="Rejected" value={stats.rejectedClaims} icon={<XCircle className="w-5 h-5" />} color="danger" />
          <StatCard label="Avg Confidence" value={`${stats.avgConfidence}%`} icon={<Target className="w-5 h-5" />} color="primary" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Claims Trend</CardTitle>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardBody>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="claims" stroke="#9333ea" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claim Status Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No claims yet</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Type Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            {vehicleTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={vehicleTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#9333ea" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {recentActivity.map((claim) => (
                  <Link
                    key={claim.id}
                    to={`/admin/claims/${claim.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{claim.claim_number}</p>
                        <p className="text-xs text-gray-500">{timeAgo(claim.created_at)}</p>
                      </div>
                    </div>
                    <StatusBadge status={claim.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-400">No recent activity</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
