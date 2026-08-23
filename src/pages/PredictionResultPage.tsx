import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, Download, Share2, ArrowRight, Brain,
  TrendingUp, TrendingDown, AlertCircle, FileText,
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase, type Prediction, type Claim } from '../lib/supabase';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDate, formatDateTime, downloadFile } from '../lib/utils';

export function PredictionResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [prediction, setPrediction] = useState<Prediction | null>(location.state?.prediction || null);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(!prediction);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: claimData }, { data: predData }] = await Promise.all([
        supabase.from('claims').select('*').eq('id', id).maybeSingle(),
        supabase.from('predictions').select('*').eq('claim_id', id).maybeSingle(),
      ]);
      if (claimData) setClaim(claimData as Claim);
      if (predData) setPrediction(predData as Prediction);
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

  if (!prediction || !claim) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Prediction not found</p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const isApproved = prediction.prediction === 'Approved';
  const gaugeData = [{ name: 'confidence', value: prediction.confidence, fill: isApproved ? '#10b981' : '#ef4444' }];
  const pieData = [
    { name: 'Approved', value: prediction.probability_approved },
    { name: 'Rejected', value: prediction.probability_rejected },
  ];
  const featureData = prediction.feature_importance.map((f) => ({
    name: f.label,
    value: f.importance * 100,
    direction: f.direction,
  }));

  const handleDownload = () => {
    const report = generateReport(claim, prediction, profile?.full_name || 'User');
    downloadFile(report, `${claim.claim_number}-report.txt`);
    toast('success', 'Report downloaded', 'Your claim report has been downloaded.');
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'InsureAI Claim Prediction', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast('success', 'Link copied', 'Prediction link copied to clipboard.');
      }
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to={`/claims/${claim.id}`} className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 mb-1">
            <FileText className="w-3.5 h-3.5" />
            {claim.claim_number}
          </Link>
          <h1 className="text-2xl font-bold">Prediction Result</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Main result */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <Card className={`overflow-hidden ${isApproved ? 'border-accent-200 dark:border-accent-800' : 'border-danger-200 dark:border-danger-800'}`}>
            <div className={`p-6 text-center ${isApproved ? 'bg-gradient-to-br from-accent-50 to-white dark:from-accent-900/20 dark:to-gray-900' : 'bg-gradient-to-br from-danger-50 to-white dark:from-danger-900/20 dark:to-gray-900'}`}>
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isApproved ? 'bg-accent-100 dark:bg-accent-900/40' : 'bg-danger-100 dark:bg-danger-900/40'}`}>
                {isApproved ? <CheckCircle2 className="w-9 h-9 text-accent-600" /> : <XCircle className="w-9 h-9 text-danger-600" />}
              </div>
              <p className="text-sm text-gray-500 mb-1">AI Prediction</p>
              <h2 className={`text-3xl font-bold mb-2 ${isApproved ? 'text-accent-600' : 'text-danger-600'}`}>
                {prediction.prediction}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <Badge variant={prediction.risk_level === 'Low' ? 'success' : prediction.risk_level === 'High' ? 'danger' : 'warning'}>
                  {prediction.risk_level} Risk
                </Badge>
                <Badge variant="outline">
                  <Brain className="w-3 h-3" />
                  {prediction.model_version}
                </Badge>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Confidence Score</span>
                <span className="font-bold text-lg">{prediction.confidence}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.confidence}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${isApproved ? 'bg-accent-500' : 'bg-danger-500'}`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Generated on {formatDateTime(prediction.created_at)}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Gauge + Pie */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Probability Analysis</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Gauge */}
              <div>
                <p className="text-sm text-gray-500 mb-2 text-center">Confidence Gauge</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background={{ fill: '#e5e7eb' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center -mt-12">
                  <span className="text-3xl font-bold">{prediction.confidence}%</span>
                </div>
              </div>
              {/* Pie */}
              <div>
                <p className="text-sm text-gray-500 mb-2 text-center">Probability Distribution</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ value }) => `${value.toFixed(1)}%`}>
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent-500" />Approved ({prediction.probability_approved}%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-danger-500" />Rejected ({prediction.probability_rejected}%)</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Feature Importance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Factors Affecting Prediction</CardTitle>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={100} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {featureData.map((d, i) => (
                    <Cell key={i} fill={d.direction === 'positive' ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* List */}
            <div className="space-y-3">
              {prediction.feature_importance.map((f, i) => (
                <motion.div
                  key={f.feature}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.direction === 'positive' ? 'bg-accent-100 dark:bg-accent-900/30' : 'bg-danger-100 dark:bg-danger-900/30'}`}>
                    {f.direction === 'positive' ? <TrendingUp className="w-4 h-4 text-accent-600" /> : <TrendingDown className="w-4 h-4 text-danger-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-gray-500">{f.value} · {f.direction === 'positive' ? 'Favors approval' : 'Favors rejection'}</p>
                  </div>
                  <span className="text-sm font-bold">{(f.importance * 100).toFixed(0)}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Next steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {isApproved ? [
              'Your claim shows high approval probability. Ensure all documents are uploaded.',
              'Check your claim status regularly for admin review updates.',
              'Download the prediction report for your records.',
              'Contact support if you need to update any claim information.',
            ] : [
              'Your claim shows rejection risk. Review the key factors above.',
              'Consider providing additional documentation to strengthen your case.',
              'Check if repair costs or previous claims can be updated.',
              'Contact your insurance provider for guidance on next steps.',
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary-600">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step}</p>
              </motion.div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center pb-4">
        <Button variant="outline" onClick={() => navigate('/claims/new')}>
          New Prediction
        </Button>
        <Button onClick={() => navigate(`/claims/${claim.id}`)}>
          View Claim Details
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function generateReport(claim: Claim, prediction: Prediction, userName: string): string {
  const lines = [
    '========================================',
    '       InsureAI - Claim Report          ',
    '========================================',
    '',
    `Claim Number: ${claim.claim_number}`,
    `Date: ${formatDate(claim.created_at)}`,
    `Customer: ${userName}`,
    '',
    '--- PREDICTION RESULT ---',
    `Prediction: ${prediction.prediction}`,
    `Confidence: ${prediction.confidence}%`,
    `Risk Level: ${prediction.risk_level}`,
    `Probability Approved: ${prediction.probability_approved}%`,
    `Probability Rejected: ${prediction.probability_rejected}%`,
    `Model: ${prediction.model_version}`,
    '',
    '--- KEY FACTORS ---',
    ...prediction.feature_importance.map((f) => `  ${f.label}: ${f.value} (${f.direction}, ${f.importance * 100}% impact)`),
    '',
    '--- CLAIM STATUS ---',
    `Status: ${claim.status}`,
    '',
    '========================================',
    '  Generated by InsureAI - insureai.com   ',
    '========================================',
  ];
  return lines.join('\n');
}
