import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle2, XCircle, Clock, TrendingUp, Plus, ArrowRight,
  BarChart3, Target,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Claim, type Prediction } from '../lib/supabase';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Misc';
import { SkeletonCard } from '../components/ui/Skeleton';
import { formatDate, timeAgo } from '../lib/utils';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profile?.id) return;
      const [{ data: claimsData }, { data: predData }] = await Promise.all([
        supabase.from('claims').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('predictions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      ]);
      setClaims(claimsData as Claim[] || []);
      setPredictions(predData as Prediction[] || []);
      setLoading(false);
    })();
  }, [profile?.id]);

  const stats = {
    total: claims.length,
    approved: claims.filter((c) => c.status === 'approved').length,
    rejected: claims.filter((c) => c.status === 'rejected').length,
    pending: claims.filter((c) => c.status === 'pending' || c.status === 'under_review').length,
    avgConfidence: predictions.length > 0
      ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100) / 100
      : 0,
  };

  const statusData = [
    { name: 'Approved', value: stats.approved },
    { name: 'Rejected', value: stats.rejected },
    { name: 'Pending', value: stats.pending },
  ].filter((d) => d.value > 0);

  // Monthly chart data
  const monthlyData = (() => {
    const months: Record<string, { month: string; claims: number; approved: number }> = {};
    claims.forEach((c) => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (!months[key]) months[key] = { month: key, claims: 0, approved: 0 };
      months[key].claims++;
      if (c.status === 'approved') months[key].approved++;
    });
    return Object.values(months).slice(-6);
  })();

  const recentClaims = claims.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-white/80">Here's an overview of your insurance claims and predictions.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/claims/new')} className="bg-white text-primary-700 hover:bg-white/90">
              <Plus className="w-4 h-4" />
              New Claim
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/claims')} className="text-white border border-white/30 hover:bg-white/10">
              View History
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Claims" value={stats.total} icon={<FileText className="w-5 h-5" />} color="primary" />
          <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 className="w-5 h-5" />} color="accent" />
          <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="w-5 h-5" />} color="danger" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="warning" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Claims Over Time</CardTitle>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardBody>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="claimsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="claims" stroke="#2563eb" fill="url(#claimsGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="approved" stroke="#10b981" fill="url(#approvedGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No claims data yet" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claim Status</CardTitle>
          </CardHeader>
          <CardBody>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No claims yet" />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Prediction accuracy + Recent claims */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prediction Accuracy</CardTitle>
              <Target className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardBody>
            <div className="text-center py-4">
              <div className="text-5xl font-bold gradient-text mb-2">{stats.avgConfidence}%</div>
              <p className="text-sm text-gray-500">Average confidence across {predictions.length} predictions</p>
            </div>
            <div className="space-y-2 mt-4">
              {predictions.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-gray-600 dark:text-gray-400 truncate">{p.prediction}</span>
                  <span className="font-medium">{p.confidence}%</span>
                </div>
              ))}
              {predictions.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No predictions yet</p>}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Claims</CardTitle>
              <Link to="/claims" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {recentClaims.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {recentClaims.map((claim) => (
                  <Link
                    key={claim.id}
                    to={`/claims/${claim.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{claim.claim_number}</p>
                        <p className="text-xs text-gray-500">{formatDate(claim.created_at)} · {timeAgo(claim.created_at)}</p>
                      </div>
                    </div>
                    <StatusBadge status={claim.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No claims yet</p>
                <Button size="sm" onClick={() => navigate('/claims/new')}>
                  <Plus className="w-4 h-4" />
                  Submit your first claim
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
      <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
