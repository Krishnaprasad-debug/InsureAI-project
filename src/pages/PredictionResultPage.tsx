import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, Download, Share2, ArrowRight, Brain,
  TrendingUp, TrendingDown, AlertCircle, FileText, ShieldAlert,
  RotateCw, ArrowLeft,
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { type Prediction, type Claim } from '../lib/supabase';
import { fetchSingleClaimMerged, fetchSinglePredictionMerged } from '../lib/claimsSync';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDate, formatDateTime, downloadFile } from '../lib/utils';

export function PredictionResultPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin, isCompany } = useAuth();
  const { toast } = useToast();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(location.state?.prediction || null);
  const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'unauthorized' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = useCallback(async () => {
    if (!id) {
      console.warn('[PredictionResultPage] No claim ID in route params');
      setStatus('not_found');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      console.log(`[PredictionResultPage] Loading claim "${id}" | User: ${profile?.id || 'anonymous'}`);

      // 1. Fetch the claim by ID or claim_number
      const claimData = await fetchSingleClaimMerged(id);

      if (!claimData) {
        console.warn(`[PredictionResultPage] Claim not found for identifier: ${id}`);
        setClaim(null);
        setPrediction(null);
        setStatus('not_found');
        return;
      }

      setClaim(claimData);

      // 2. Authentication & Ownership Verification
      const isSampleClaim =
        claimData.id === 'claim-91mcf0xw' ||
        claimData.id === 'claim-nph8gbet' ||
        claimData.claim_number === 'CLM-91MCF0XW' ||
        claimData.claim_number === 'CLM-NPH8GBET';

      const isOwner = isSampleClaim || (profile?.id && claimData.user_id === profile.id);
      const isStaff = isAdmin || isCompany;

      if (!isOwner && !isStaff && profile?.id) {
        console.warn(`[PredictionResultPage] Unauthorized attempt by user ${profile.id} for claim ${claimData.id}`);
        setStatus('unauthorized');
        return;
      }

      // 3. Fetch Prediction (by claim.id and claim.claim_number)
      let predData = await fetchSinglePredictionMerged(claimData.id, claimData.claim_number);

      // Fallback to location state prediction if matching
      if (!predData && location.state?.prediction) {
        const statePred = location.state.prediction as Prediction;
        if (statePred.claim_id === claimData.id || statePred.claim_id === claimData.claim_number || statePred.id === claimData.id) {
          predData = statePred;
        }
      }

      if (predData) {
        console.log(`[PredictionResultPage] Prediction loaded for claim ${claimData.claim_number}:`, predData.prediction, `(${predData.confidence}%)`);
        setPrediction(predData);
        setStatus('success');
      } else {
        console.info(`[PredictionResultPage] No prediction generated for claim ${claimData.claim_number}`);
        setPrediction(null);
        setStatus('not_found');
      }
    } catch (err: any) {
      console.error('[PredictionResultPage] Error loading prediction:', err);
      setErrorMessage(err?.message || 'Unable to load prediction. Please try again.');
      setStatus('error');
    }
  }, [id, profile?.id, isAdmin, isCompany, location.state]);

  useEffect(() => {
    loadData();
  }, [loadData, reloadKey]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="w-10 h-10 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Loading prediction...</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Retrieving claim details and AI inference results.
        </p>
      </div>
    );
  }

  // Unauthorized state
  if (status === 'unauthorized') {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <Card className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-900/30 text-danger-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-6">
            You do not have permission to view predictions for this claim.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/claims')}>
              <ArrowLeft className="w-4 h-4" />
              Back to Claim History
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <Card className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-900/30 text-danger-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Unable to Load Prediction</h2>
          <p className="text-sm text-gray-500 mb-6">
            {errorMessage || 'A network error or database issue occurred while retrieving the prediction. Please try again.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
              <RotateCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button onClick={() => navigate('/claims')}>
              Back to Claims
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Not Found State
  if (status === 'not_found' || !prediction || !claim) {
    if (claim) {
      return (
        <div className="max-w-lg mx-auto my-12">
          <Card className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold mb-2">Prediction Unavailable</h2>
            <p className="text-sm text-gray-500 mb-6">
              Prediction has not been generated for this claim.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-left text-sm space-y-2 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Claim Number:</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">{claim.claim_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="capitalize font-medium">{claim.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle:</span>
                <span>{claim.vehicle_details?.vehicleBrand || '—'} {claim.vehicle_details?.vehicleModel || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted:</span>
                <span>{formatDate(claim.created_at)}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/claims')}>
                <ArrowLeft className="w-4 h-4" />
                Back to Claims
              </Button>
              <Button onClick={() => navigate(`/claims/${claim.id}`)}>
                <FileText className="w-4 h-4" />
                View Claim Details
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <Card className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Claim Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">
            We could not find any claim matching "{id}". Please check the URL or return to your claims.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/claims')}>
              <ArrowLeft className="w-4 h-4" />
              Back to Claims
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isApproved = (prediction.prediction as string) === 'Claim Likely' || (prediction.prediction as string) === 'Approved';
  const confidence = typeof prediction.confidence === 'number' ? prediction.confidence : 80;
  const gaugeData = [{ name: 'confidence', value: confidence, fill: isApproved ? '#10b981' : '#ef4444' }];

  const probApproved = typeof prediction.probability_approved === 'number'
    ? prediction.probability_approved
    : isApproved ? confidence : 100 - confidence;
  const probRejected = typeof prediction.probability_rejected === 'number'
    ? prediction.probability_rejected
    : 100 - probApproved;

  const pieData = [
    { name: 'Approved', value: probApproved },
    { name: 'Rejected', value: probRejected },
  ];

  const rawFeatures = Array.isArray(prediction.feature_importance) ? prediction.feature_importance : [];
  const featureData = rawFeatures.map((f) => ({
    name: f.label || f.feature,
    value: Math.round((f.importance || 0) * 100),
    direction: f.direction || 'positive',
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
          <Card className={`overflow-hidden ${isApproved ? 'border-primary-200 dark:border-primary-800' : 'border-danger-200 dark:border-danger-800'}`}>
            <div className={`p-6 text-center ${isApproved ? 'bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900' : 'bg-gradient-to-br from-danger-50 to-white dark:from-danger-900/20 dark:to-gray-900'}`}>
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isApproved ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-danger-100 dark:bg-danger-900/40'}`}>
                {isApproved ? <CheckCircle2 className="w-9 h-9 text-primary-600" /> : <XCircle className="w-9 h-9 text-danger-600" />}
              </div>
              <p className="text-sm text-gray-500 mb-1">AI Prediction</p>
              <h2 className={`text-3xl font-bold mb-2 ${isApproved ? 'text-primary-600' : 'text-danger-600'}`}>
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
                  className={`h-full rounded-full ${isApproved ? 'bg-primary-500' : 'bg-danger-500'}`}
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
                <div className="relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: '#e5e7eb' }} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{prediction.confidence}%</span>
                    <span className="text-xs text-gray-400 font-medium">Confidence</span>
                  </div>
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
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary-500" />Approved ({prediction.probability_approved}%)</span>
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
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.direction === 'positive' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-danger-100 dark:bg-danger-900/30'}`}>
                    {f.direction === 'positive' ? <TrendingUp className="w-4 h-4 text-primary-600" /> : <TrendingDown className="w-4 h-4 text-danger-600" />}
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
  const featureList = Array.isArray(prediction.feature_importance) ? prediction.feature_importance : [];
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
    `Model: ${prediction.model_version || 'xgboost-v1.0'}`,
    '',
    '--- KEY FACTORS ---',
    ...featureList.map((f) => `  ${f.label || f.feature}: ${f.value} (${f.direction}, ${Math.round((f.importance || 0) * 100)}% impact)`),
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
