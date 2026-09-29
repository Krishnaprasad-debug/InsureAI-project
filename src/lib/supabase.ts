import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'customer' | 'company' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  occupation: string | null;
  company_name?: string | null;
  officer_title?: string | null;
  annual_income: number | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  date_of_birth: string | null;
  notification_settings: { email: boolean; push: boolean };
  created_at: string;
  updated_at: string;
}

export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type CompanyDecision = 'Pending' | 'Approved' | 'Rejected' | 'More Information Required';

export interface Claim {
  id: string;
  user_id: string;
  claim_number: string;
  status: ClaimStatus;
  company_decision?: CompanyDecision;
  personal_info: Record<string, any>;
  vehicle_details: Record<string, any>;
  insurance_details: Record<string, any>;
  driver_details: Record<string, any>;
  accident_details: Record<string, any>;
  documents: DocumentEntry[];
  timeline: TimelineEntry[];
  admin_remarks: string | null;
  rejection_reason?: string | null;
  officer_message?: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentEntry {
  id: string;
  type: string;
  name: string;
  size: number;
  dataUrl: string;
  uploaded_at: string;
}

export interface TimelineEntry {
  status: string;
  label: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface Prediction {
  id: string;
  claim_id: string;
  user_id: string;
  prediction: 'Claim Likely' | 'Claim Unlikely';
  confidence: number;
  risk_level: 'Low' | 'Medium' | 'High';
  probability_approved: number;
  probability_rejected: number;
  feature_importance: FeatureImportance[];
  model_version: string;
  created_at: string;
}

export interface FeatureImportance {
  feature: string;
  label: string;
  importance: number;
  direction: 'positive' | 'negative';
  value: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  claim_id?: string;
  target_role?: string;
  created_at: string;
}
