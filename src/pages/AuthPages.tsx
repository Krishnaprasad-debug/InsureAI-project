import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { ShieldCheck, Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Misc';

function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-slate-100">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80')` }}
      >
        {/* Subtle overlay for text readability on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent"></div>
      </div>
      
      <div className="relative z-10 flex w-full max-w-7xl mx-auto">
        {/* Left panel - Text and features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 lg:pr-24">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold tracking-tight text-slate-900 leading-none">Insure<span className="text-primary-600">AI</span></span>
              <span className="text-[10px] text-slate-500 font-medium">Smarter Claims. Safer Roads.</span>
            </div>
          </div>
          
          <div className="mb-4 inline-flex items-center gap-1.5 bg-secondary-50/80 backdrop-blur-sm border border-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide w-fit">
             <Lock className="w-3 h-3" />
             AI POWERED
          </div>

          <h1 className="font-display text-5xl font-extrabold leading-tight text-slate-900 mb-4">
            Insurance <br/>
            Claims Made <br/>
            <span className="text-primary-600">Smarter</span>
          </h1>
          
          <p className="text-slate-700 text-lg leading-relaxed max-w-md mb-10 font-medium">
            Predict claim likelihood, streamline verification, and make fairer insurance decisions with AI.
          </p>
          
          <div className="space-y-4">
            {[
              { text: 'AI-powered predictions', color: 'text-primary-600', bg: 'bg-primary-100' },
              { text: 'Real-time claim tracking', color: 'text-secondary-600', bg: 'bg-secondary-100' },
              { text: 'Secure document handling', color: 'text-accent-600', bg: 'bg-accent-100' },
              { text: 'Transparent claim process', color: 'text-danger-600', bg: 'bg-danger-100' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/70 backdrop-blur-md border border-white/50 px-5 py-3 rounded-2xl w-fit shadow-sm hover:scale-[1.02] transition-transform cursor-default">
                <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center ${item.color} shrink-0`}>
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-slate-800 font-semibold text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - Auth Card */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-slate-900/10 border border-white/50"
          >
            <div className="flex flex-col items-center text-center mb-8">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4">
                  <ShieldCheck className="w-8 h-8 text-white" />
               </div>
               <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">{title}</h2>
               <p className="text-slate-500 text-sm">{subtitle}</p>
            </div>
            
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { signIn, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      toast('error', 'Login failed', error);
    } else {
      const { data: userAuth } = await supabase.auth.getUser();
      if (userAuth?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userAuth.user.id).single();
        await refreshProfile(userAuth.user.id);
        
        setLoading(false);
        const role = profile?.role || 'customer';
        
        if (role === 'admin') {
          toast('success', 'Welcome Admin!', 'Logged into Admin Portal.');
          navigate('/admin');
        } else if (role === 'company') {
          toast('success', 'Welcome Officer!', 'Logged into Insurance Officer Portal.');
          navigate('/company/dashboard');
        } else {
          toast('success', 'Welcome back!', 'Logged into Customer Portal.');
          navigate('/dashboard');
        }
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to your InsureAI account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg shadow-primary-500/30 border-0 rounded-xl transition-all">
          Sign In
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
          Sign up as Customer
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role] = useState<'customer' | 'company'>('customer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName) e.fullName = 'Full name is required';
    else if (fullName.length < 2) e.fullName = 'Name must be at least 2 characters';
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (phone && !/^[0-9+\-\s()]{10,15}$/.test(phone)) e.phone = 'Invalid phone number';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) e.password = 'Password must contain letters and numbers';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agree) e.agree = 'You must accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    setLoading(false);
    if (error) {
      if (error.toLowerCase().includes('weak') || error.toLowerCase().includes('pwned')) {
        toast('error', 'Weak Password', 'Please choose a stronger, more unique password. Supabase security has rejected this password.');
      } else {
        toast('error', 'Registration failed', error);
      }
    } else {
      toast('success', 'Account created!', 'Please sign in with your credentials.');
      navigate('/login');
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start predicting insurance claims with AI in minutes.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="fullName"
          placeholder="Rahul Sharma"
          icon={<User className="w-4 h-4" />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
        />
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Mobile Number"
          name="phone"
          placeholder="+91 98765 43210"
          icon={<Mail className="w-4 h-4" />}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          hint="Optional — for SMS notifications"
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder="••••••••"
          icon={<Lock className="w-4 h-4" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />
        <div>
          <Checkbox checked={agree} onChange={setAgree} label={<>I agree to the Terms of Service and Privacy Policy</>} />
          {errors.agree && <p className="mt-1 text-xs text-danger-500">{errors.agree}</p>}
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg shadow-primary-500/30 border-0 rounded-xl transition-all">
          Create Account
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('error', 'Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    // Simulate sending reset link
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
    toast('success', 'Reset link sent', 'Check your email for password reset instructions.');
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-accent-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a password reset link to <span className="font-medium text-gray-900 dark:text-white">{email}</span>. Check your inbox and follow the instructions.
          </p>
          <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="lg" loading={loading} className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg shadow-primary-500/30 border-0 rounded-xl transition-all">
            Send Reset Link
          </Button>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        </form>
      )}
    </AuthShell>
  );
}
