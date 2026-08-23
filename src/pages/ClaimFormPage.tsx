import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Car, Shield, ShipWheel, AlertTriangle, Upload, FileText,
  Check, ChevronRight, ChevronLeft, X, UploadCloud, Brain, Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase, type DocumentEntry, type TimelineEntry } from '../lib/supabase';
import { predictClaim } from '../lib/prediction';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { cn, formatBytes, generateClaimNumber } from '../lib/utils';

const STEPS = [
  { id: 0, label: 'Personal', icon: User },
  { id: 1, label: 'Vehicle', icon: Car },
  { id: 2, label: 'Insurance', icon: Shield },
  { id: 3, label: 'Driver', icon: ShipWheel },
  { id: 4, label: 'Accident', icon: AlertTriangle },
  { id: 5, label: 'Documents', icon: Upload },
  { id: 6, label: 'Review', icon: Check },
];

const vehicleTypes = [
  { value: 'Car', label: 'Car' },
  { value: 'Bike', label: 'Bike' },
  { value: 'Truck', label: 'Truck' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Bus', label: 'Bus' },
];

const fuelTypes = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Electric', label: 'Electric' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'CNG', label: 'CNG' },
];

const accidentTypes = [
  { value: 'Minor', label: 'Minor' },
  { value: 'Major', label: 'Major' },
  { value: 'Collision', label: 'Collision' },
  { value: 'Natural Disaster', label: 'Natural Disaster' },
  { value: 'Theft', label: 'Theft' },
];

const weatherConditions = [
  { value: 'Clear', label: 'Clear' },
  { value: 'Rainy', label: 'Rainy' },
  { value: 'Foggy', label: 'Foggy' },
  { value: 'Stormy', label: 'Stormy' },
  { value: 'Snowy', label: 'Snowy' },
];

const documentTypes = [
  { key: 'drivingLicense', label: 'Driving License' },
  { key: 'rcBook', label: 'RC Book' },
  { key: 'insurancePolicy', label: 'Insurance Policy' },
  { key: 'vehicleImages', label: 'Vehicle Images' },
  { key: 'accidentImages', label: 'Accident Images' },
  { key: 'policeFIR', label: 'Police FIR' },
  { key: 'estimateBill', label: 'Estimate Bill' },
];

export function ClaimFormPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    personal: {
      fullName: profile?.full_name || '',
      age: '',
      gender: '',
      occupation: '',
      annualIncome: '',
      city: '',
      state: '',
      pinCode: '',
    },
    vehicle: {
      vehicleType: '',
      vehicleBrand: '',
      vehicleModel: '',
      vehicleAge: '',
      manufacturingYear: '',
      fuelType: '',
      engineCapacity: '',
      transmission: '',
      vehicleValue: '',
      mileage: '',
      registrationState: '',
    },
    insurance: {
      policyType: '',
      policyDuration: '',
      premiumAmount: '',
      policyStartDate: '',
      policyEndDate: '',
      noClaimBonus: '',
      previousClaims: '',
      coverageAmount: '',
      insuranceCompany: '',
    },
    driver: {
      drivingExperience: '',
      licenseValidity: '',
      trafficViolations: '',
      accidentHistory: '',
      drivingScore: '',
    },
    accident: {
      accidentType: '',
      repairCost: '',
      date: '',
      location: '',
      policeReport: '',
      hospitalization: '',
      thirdPartyDamage: '',
      weatherCondition: '',
      description: '',
    },
  });
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);

  const updateField = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [field]: value },
    }));
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!profile?.id) return;
    setSubmitting(true);

    try {
      const claimNumber = generateClaimNumber();
      const now = new Date().toISOString();

      const timeline: TimelineEntry[] = [
        { status: 'submitted', label: 'Claim Submitted', description: 'Your claim has been submitted successfully.', timestamp: now, completed: true },
        { status: 'prediction', label: 'AI Prediction', description: 'XGBoost model is analyzing your claim.', timestamp: now, completed: true },
        { status: 'verification', label: 'Document Verification', description: 'Documents are being verified by our team.', timestamp: '', completed: false },
        { status: 'review', label: 'Admin Review', description: 'An administrator is reviewing your claim.', timestamp: '', completed: false },
        { status: 'completed', label: 'Completed', description: 'Final decision has been made.', timestamp: '', completed: false },
      ];

      // Run prediction
      const prediction = predictClaim({
        personal: formData.personal,
        vehicle: formData.vehicle,
        insurance: formData.insurance,
        driver: formData.driver,
        accident: formData.accident,
      });

      // Insert claim
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert({
          user_id: profile.id,
          claim_number: claimNumber,
          status: 'pending',
          personal_info: formData.personal,
          vehicle_details: formData.vehicle,
          insurance_details: formData.insurance,
          driver_details: formData.driver,
          accident_details: formData.accident,
          documents,
          timeline,
        })
        .select()
        .single();

      if (claimError) throw claimError;

      // Insert prediction
      const { data: pred, error: predError } = await supabase
        .from('predictions')
        .insert({
          claim_id: claim.id,
          user_id: profile.id,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          risk_level: prediction.risk_level,
          probability_approved: prediction.probability_approved,
          probability_rejected: prediction.probability_rejected,
          feature_importance: prediction.feature_importance,
          model_version: prediction.model_version,
        })
        .select()
        .single();

      if (predError) throw predError;

      // Insert notification
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Prediction Completed',
        message: `Your claim ${claimNumber} has been analyzed. Prediction: ${prediction.prediction} (${prediction.confidence}% confidence)`,
        type: 'success',
      });

      toast('success', 'Claim submitted!', 'AI prediction is ready.');
      navigate(`/claims/${claim.id}/result`, { state: { prediction: pred } });
    } catch (err: any) {
      toast('error', 'Submission failed', err.message || 'Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Submit a New Claim</h1>
        <p className="text-gray-500">Fill out the form below to get an AI-powered prediction.</p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isComplete = idx < step;
            const isActive = idx === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                      isComplete && 'bg-accent-500 text-white',
                      isActive && 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40',
                      !isComplete && !isActive && 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                    )}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={cn('text-xs font-medium hidden sm:block', isActive ? 'text-primary-600' : 'text-gray-500')}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1 mx-2 rounded-full transition-colors', isComplete ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-800')} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 0: Personal */}
              {step === 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Personal Information</h2>
                  <p className="text-sm text-gray-500 mb-6">Tell us about yourself.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name" value={formData.personal.fullName} onChange={(e) => updateField('personal', 'fullName', e.target.value)} placeholder="Rahul Sharma" />
                    <Input label="Age" type="number" value={formData.personal.age} onChange={(e) => updateField('personal', 'age', e.target.value)} placeholder="35" />
                    <Select label="Gender" placeholder="Select gender" options={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]} value={formData.personal.gender} onChange={(e) => updateField('personal', 'gender', e.target.value)} />
                    <Input label="Occupation" value={formData.personal.occupation} onChange={(e) => updateField('personal', 'occupation', e.target.value)} placeholder="Software Engineer" />
                    <Input label="Annual Income (₹)" type="number" value={formData.personal.annualIncome} onChange={(e) => updateField('personal', 'annualIncome', e.target.value)} placeholder="600000" />
                    <Input label="City" value={formData.personal.city} onChange={(e) => updateField('personal', 'city', e.target.value)} placeholder="Coimbatore" />
                    <Input label="State" value={formData.personal.state} onChange={(e) => updateField('personal', 'state', e.target.value)} placeholder="Tamil Nadu" />
                    <Input label="PIN Code" value={formData.personal.pinCode} onChange={(e) => updateField('personal', 'pinCode', e.target.value)} placeholder="641659" />
                  </div>
                </div>
              )}

              {/* Step 1: Vehicle */}
              {step === 1 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Vehicle Details</h2>
                  <p className="text-sm text-gray-500 mb-6">Information about your vehicle.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Vehicle Type" placeholder="Select type" options={vehicleTypes} value={formData.vehicle.vehicleType} onChange={(e) => updateField('vehicle', 'vehicleType', e.target.value)} />
                    <Input label="Vehicle Brand" value={formData.vehicle.vehicleBrand} onChange={(e) => updateField('vehicle', 'vehicleBrand', e.target.value)} placeholder="Maruti Suzuki" />
                    <Input label="Vehicle Model" value={formData.vehicle.vehicleModel} onChange={(e) => updateField('vehicle', 'vehicleModel', e.target.value)} placeholder="Swift" />
                    <Input label="Vehicle Age (years)" type="number" value={formData.vehicle.vehicleAge} onChange={(e) => updateField('vehicle', 'vehicleAge', e.target.value)} placeholder="3" />
                    <Input label="Manufacturing Year" type="number" value={formData.vehicle.manufacturingYear} onChange={(e) => updateField('vehicle', 'manufacturingYear', e.target.value)} placeholder="2021" />
                    <Select label="Fuel Type" placeholder="Select fuel" options={fuelTypes} value={formData.vehicle.fuelType} onChange={(e) => updateField('vehicle', 'fuelType', e.target.value)} />
                    <Input label="Engine Capacity (cc)" type="number" value={formData.vehicle.engineCapacity} onChange={(e) => updateField('vehicle', 'engineCapacity', e.target.value)} placeholder="2000" />
                    <Select label="Transmission" placeholder="Select transmission" options={[{value:'Manual',label:'Manual'},{value:'Automatic',label:'Automatic'}]} value={formData.vehicle.transmission} onChange={(e) => updateField('vehicle', 'transmission', e.target.value)} />
                    <Input label="Vehicle Value (₹)" type="number" value={formData.vehicle.vehicleValue} onChange={(e) => updateField('vehicle', 'vehicleValue', e.target.value)} placeholder="800000" />
                    <Input label="Mileage (km/l)" type="number" value={formData.vehicle.mileage} onChange={(e) => updateField('vehicle', 'mileage', e.target.value)} placeholder="15" />
                    <Input label="Registration State" value={formData.vehicle.registrationState} onChange={(e) => updateField('vehicle', 'registrationState', e.target.value)} placeholder="Tamil Nadu" />
                  </div>
                </div>
              )}

              {/* Step 2: Insurance */}
              {step === 2 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Insurance Details</h2>
                  <p className="text-sm text-gray-500 mb-6">Your policy information.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Policy Type" placeholder="Select type" options={[{value:'Comprehensive',label:'Comprehensive'},{value:'Third Party',label:'Third Party'},{value:'Collision',label:'Collision'}]} value={formData.insurance.policyType} onChange={(e) => updateField('insurance', 'policyType', e.target.value)} />
                    <Select label="Policy Duration" placeholder="Select duration" options={[{value:'1 Year',label:'1 Year'},{value:'2 Years',label:'2 Years'},{value:'3 Years',label:'3 Years'}]} value={formData.insurance.policyDuration} onChange={(e) => updateField('insurance', 'policyDuration', e.target.value)} />
                    <Input label="Premium Amount (₹)" type="number" value={formData.insurance.premiumAmount} onChange={(e) => updateField('insurance', 'premiumAmount', e.target.value)} placeholder="12000" />
                    <Input label="Policy Start Date" type="date" value={formData.insurance.policyStartDate} onChange={(e) => updateField('insurance', 'policyStartDate', e.target.value)} />
                    <Input label="Policy End Date" type="date" value={formData.insurance.policyEndDate} onChange={(e) => updateField('insurance', 'policyEndDate', e.target.value)} />
                    <Input label="No Claim Bonus (%)" type="number" value={formData.insurance.noClaimBonus} onChange={(e) => updateField('insurance', 'noClaimBonus', e.target.value)} placeholder="20" />
                    <Input label="Previous Claims" type="number" value={formData.insurance.previousClaims} onChange={(e) => updateField('insurance', 'previousClaims', e.target.value)} placeholder="0" />
                    <Input label="Coverage Amount (₹)" type="number" value={formData.insurance.coverageAmount} onChange={(e) => updateField('insurance', 'coverageAmount', e.target.value)} placeholder="500000" />
                    <Input label="Insurance Company" value={formData.insurance.insuranceCompany} onChange={(e) => updateField('insurance', 'insuranceCompany', e.target.value)} placeholder="New India Assurance" />
                  </div>
                </div>
              )}

              {/* Step 3: Driver */}
              {step === 3 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Driver Details</h2>
                  <p className="text-sm text-gray-500 mb-6">Your driving history.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Driving Experience (years)" type="number" value={formData.driver.drivingExperience} onChange={(e) => updateField('driver', 'drivingExperience', e.target.value)} placeholder="10" />
                    <Input label="License Validity" type="date" value={formData.driver.licenseValidity} onChange={(e) => updateField('driver', 'licenseValidity', e.target.value)} />
                    <Input label="Traffic Violations" type="number" value={formData.driver.trafficViolations} onChange={(e) => updateField('driver', 'trafficViolations', e.target.value)} placeholder="0" />
                    <Input label="Accident History (count)" type="number" value={formData.driver.accidentHistory} onChange={(e) => updateField('driver', 'accidentHistory', e.target.value)} placeholder="1" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Driving Score (0-100)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formData.driver.drivingScore || 50}
                        onChange={(e) => updateField('driver', 'drivingScore', e.target.value)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span className="font-medium text-primary-600">{formData.driver.drivingScore || 50}</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Accident */}
              {step === 4 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Accident Details</h2>
                  <p className="text-sm text-gray-500 mb-6">Tell us about the incident.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Accident Type" placeholder="Select type" options={accidentTypes} value={formData.accident.accidentType} onChange={(e) => updateField('accident', 'accidentType', e.target.value)} />
                    <Input label="Repair Cost (₹)" type="number" value={formData.accident.repairCost} onChange={(e) => updateField('accident', 'repairCost', e.target.value)} placeholder="25000" />
                    <Input label="Date" type="date" value={formData.accident.date} onChange={(e) => updateField('accident', 'date', e.target.value)} />
                    <Input label="Location" value={formData.accident.location} onChange={(e) => updateField('accident', 'location', e.target.value)} placeholder="Avinashi Road, Coimbatore" />
                    <Select label="Police Report Filed?" placeholder="Select" options={[{value:'Yes',label:'Yes'},{value:'No',label:'No'}]} value={formData.accident.policeReport} onChange={(e) => updateField('accident', 'policeReport', e.target.value)} />
                    <Select label="Hospitalization Required?" placeholder="Select" options={[{value:'Yes',label:'Yes'},{value:'No',label:'No'}]} value={formData.accident.hospitalization} onChange={(e) => updateField('accident', 'hospitalization', e.target.value)} />
                    <Select label="Third Party Damage?" placeholder="Select" options={[{value:'Yes',label:'Yes'},{value:'No',label:'No'}]} value={formData.accident.thirdPartyDamage} onChange={(e) => updateField('accident', 'thirdPartyDamage', e.target.value)} />
                    <Select label="Weather Condition" placeholder="Select weather" options={weatherConditions} value={formData.accident.weatherCondition} onChange={(e) => updateField('accident', 'weatherCondition', e.target.value)} />
                    <div className="sm:col-span-2">
                      <Textarea label="Description" rows={3} value={formData.accident.description} onChange={(e) => updateField('accident', 'description', e.target.value)} placeholder="Describe what happened..." />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Documents */}
              {step === 5 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Upload Documents</h2>
                  <p className="text-sm text-gray-500 mb-6">Drag and drop or click to upload your files.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documentTypes.map((doc) => (
                      <DocumentUploader
                        key={doc.key}
                        label={doc.label}
                        type={doc.key}
                        documents={documents}
                        setDocuments={setDocuments}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: Review */}
              {step === 6 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Review & Submit</h2>
                  <p className="text-sm text-gray-500 mb-6">Please review your information before submitting.</p>
                  <div className="space-y-4">
                    {[
                      { label: 'Personal', icon: User, data: formData.personal, fields: ['fullName', 'age', 'gender', 'occupation', 'city'] },
                      { label: 'Vehicle', icon: Car, data: formData.vehicle, fields: ['vehicleType', 'vehicleBrand', 'vehicleModel', 'vehicleAge', 'fuelType'] },
                      { label: 'Insurance', icon: Shield, data: formData.insurance, fields: ['policyType', 'premiumAmount', 'coverageAmount', 'insuranceCompany'] },
                      { label: 'Driver', icon: ShipWheel, data: formData.driver, fields: ['drivingExperience', 'trafficViolations', 'drivingScore'] },
                      { label: 'Accident', icon: AlertTriangle, data: formData.accident, fields: ['accidentType', 'repairCost', 'date', 'location'] },
                    ].map((section) => {
                      const Icon = section.icon;
                      return (
                        <div key={section.label} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-primary-600" />
                            </div>
                            <h3 className="font-medium">{section.label}</h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                            {section.fields.map((field) => (
                              <div key={field}>
                                <span className="text-gray-400 capitalize">{field.replace(/([A-Z])/g, ' $1')}: </span>
                                <span className="font-medium">{(section.data as any)[field] || '—'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Upload className="w-4 h-4 text-primary-600" />
                        <h3 className="font-medium">Documents ({documents.length})</h3>
                      </div>
                      {documents.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {documents.map((doc) => (
                            <span key={doc.id} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                              {doc.type}: {doc.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No documents uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer with nav */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <Button variant="outline" onClick={prev} disabled={step === 0 || submitting}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting} size="lg">
              {!submitting && <Brain className="w-4 h-4" />}
              {submitting ? 'Analyzing...' : 'Predict Claim'}
            </Button>
          )}
        </div>
      </Card>

      {submitting && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
            <h3 className="font-semibold text-lg mb-1">AI is analyzing your claim</h3>
            <p className="text-sm text-gray-500">Running XGBoost model on 12+ features...</p>
            <div className="mt-4 space-y-1.5">
              {['Extracting features', 'Computing probabilities', 'Generating prediction'].map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 justify-center"
                >
                  <Check className="w-4 h-4 text-accent-500" />
                  {label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DocumentUploader({
  label,
  type,
  documents,
  setDocuments,
}: {
  label: string;
  type: string;
  documents: DocumentEntry[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentEntry[]>>;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const existing = documents.filter((d) => d.type === type);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return; // 5MB limit
      const reader = new FileReader();
      reader.onload = () => {
        const doc: DocumentEntry = {
          id: Math.random().toString(36).slice(2),
          type,
          name: file.name,
          size: file.size,
          dataUrl: reader.result as string,
          uploaded_at: new Date().toISOString(),
        };
        setDocuments((prev) => [...prev, doc]);
      };
      reader.readAsDataURL(file);
    });
  }, [type, setDocuments]);

  const removeDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {existing.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {existing.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
              <FileText className="w-4 h-4 text-primary-500 shrink-0" />
              <span className="flex-1 truncate">{doc.name}</span>
              <span className="text-gray-400">{formatBytes(doc.size)}</span>
              <button onClick={() => removeDoc(doc.id)} className="text-gray-400 hover:text-danger-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
          dragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-primary-400',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <UploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-1" />
        <p className="text-xs text-gray-500">Drop files or click to upload</p>
        <p className="text-xs text-gray-400 mt-0.5">Max 5MB per file</p>
      </div>
    </div>
  );
}
