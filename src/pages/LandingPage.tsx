import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, ShieldCheck, Zap, FileSearch, TrendingUp, Clock,
  ArrowRight, Check, Star, Quote, ChevronDown, Phone, Mail, MapPin,
} from 'lucide-react';
import { useState } from 'react';
import { LandingNav } from '../components/LandingNav';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const features = [
  { icon: Brain, title: 'AI-Powered Prediction', desc: 'XGBoost model analyzes 12+ features to predict claim approval with 94%+ accuracy.' },
  { icon: Zap, title: 'Instant Results', desc: 'Get prediction results in seconds, not weeks. No more waiting for manual reviews.' },
  { icon: ShieldCheck, title: 'Secure & Encrypted', desc: 'Bank-grade encryption, JWT auth, and role-based access protect your data.' },
  { icon: FileSearch, title: 'Document Management', desc: 'Drag-and-drop upload for all your documents with automatic preview and validation.' },
  { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'Track claim trends, success rates, and confidence scores with beautiful charts.' },
  { icon: Clock, title: 'Real-time Tracking', desc: 'Monitor your claim status through every stage — from submission to resolution.' },
];

const steps = [
  { num: '01', title: 'Submit Your Claim', desc: 'Fill out our multi-step form with vehicle, insurance, and accident details.' },
  { num: '02', title: 'AI Analysis', desc: 'Our XGBoost model instantly analyzes your data and generates a prediction.' },
  { num: '03', title: 'Get Results', desc: 'View your approval probability, confidence score, and key contributing factors.' },
  { num: '04', title: 'Track & Download', desc: 'Monitor claim status in real-time and download detailed PDF reports.' },
];

const testimonials = [
  { name: 'Sarah Johnson', role: 'Policyholder', text: 'InsureAI predicted my claim approval in seconds. The transparency and speed were incredible — no more waiting weeks for a response.', rating: 5 },
  { name: 'Michael Chen', role: 'Insurance Agent', text: 'The AI confidence scores help me prioritize claims efficiently. It\'s transformed how our team handles the review process.', rating: 5 },
  { name: 'Priya Patel', role: 'Fleet Manager', text: 'Managing 40+ vehicle claims used to be a nightmare. InsureAI\'s dashboard and analytics save us hours every week.', rating: 5 },
];

const stats = [
  { value: '94.6%', label: 'Prediction Accuracy' },
  { value: '50K+', label: 'Claims Processed' },
  { value: '< 3s', label: 'Average Prediction Time' },
  { value: '99.9%', label: 'Uptime' },
];

const faqs = [
  { q: 'How does the AI prediction work?', a: 'Our XGBoost model analyzes 12+ features from your claim — including vehicle age, repair costs, driving history, and policy details — to generate a probability score for approval. The model is trained on historical claim data.' },
  { q: 'Is my data secure?', a: 'Yes. We use bank-grade encryption, JWT authentication, and role-based access control. Your data is never shared with third parties and is stored in compliance with data protection regulations.' },
  { q: 'How accurate is the prediction?', a: 'Our model achieves 94.6% accuracy on test data. However, predictions are probabilistic estimates — the final claim decision is always made by your insurance provider.' },
  { q: 'Can I download a report?', a: 'Yes! Every prediction comes with a downloadable PDF report containing your claim details, prediction results, probability charts, and key contributing factors.' },
  { q: 'Do I need to create an account?', a: 'Yes, creating an account allows you to submit claims, track their status, view prediction history, and download reports. Registration is free and takes less than a minute.' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen">
      <LandingNav />

      {/* Hero */}
      <section id="home" className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 dark:opacity-10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              Powered by XGBoost Machine Learning
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              AI-Powered Vehicle Insurance<br />
              <span className="gradient-text">Claim Prediction</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Predict claim approval instantly using Machine Learning. Submit your claim, get AI-powered predictions with confidence scores, and track status in real-time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate('/register')} className="group">
                Predict Claim
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Hero preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-8 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                      <FileSearch className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Claim Analysis</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Claim #CLM-8X4K2P</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Vehicle Age', value: '3 years', impact: 'Positive' },
                      { label: 'Repair Cost', value: '₹25,000', impact: 'Positive' },
                      { label: 'Driving Score', value: '85/100', impact: 'Positive' },
                      { label: 'Previous Claims', value: '0', impact: 'Positive' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.value}</span>
                          <span className="text-accent-600 text-xs">↑</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-8 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-500 mb-2">Prediction Result</p>
                  <div className="text-5xl font-bold gradient-text mb-2">Approved</div>
                  <div className="text-3xl font-bold text-accent-600 mb-4">94.63%</div>
                  <div className="w-full bg-white dark:bg-gray-800 rounded-full h-2 mb-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: '94.63%' }} />
                  </div>
                  <p className="text-xs text-gray-500">Confidence Score</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Why Choose InsureAI</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Everything you need to submit, predict, and track vehicle insurance claims — powered by cutting-edge AI.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card hover className="h-full p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Four simple steps from claim submission to final decision.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-5xl font-bold text-primary-100 dark:text-primary-900/40 mb-2">{step.num}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-6 -right-3 w-5 h-5 text-gray-300 dark:text-gray-700" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">What Our Users Say</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Trusted by policyholders, agents, and fleet managers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full p-6">
                  <Quote className="w-8 h-8 text-primary-200 dark:text-primary-800 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t.text}</p>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-warning-400 text-warning-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About + Contact CTA */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">About InsureAI</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                InsureAI is a production-ready, enterprise-style AI insurance platform that transforms how vehicle insurance claims are predicted and managed. By leveraging XGBoost machine learning, we provide instant, transparent, and accurate claim predictions.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our platform serves policyholders, insurance agents, and administrators with a polished, intuitive interface — from claim submission to final decision.
              </p>
              <div className="space-y-3">
                {['Real-time AI prediction with confidence scores', 'Complete claim lifecycle management', 'Beautiful analytics and reporting', 'Bank-grade security and encryption'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent-600" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div id="contact">
              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium">+91 86086 98716</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">skpkrishna25@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium">44, Karumathampatti, Coimbatore - 641659</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={() => navigate('/register')}>
                  Start Your First Claim
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
