// Cloudflare Workers environment bindings
export interface Env {
  DB: D1Database;
  RESUMES_BUCKET: R2Bucket;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  OPENROUTER_API_KEY: string;
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;
  ENVIRONMENT: string;
  SANDBOX_MODE?: string; // "true" to enable mock AI, email, and auth bypass
  // Uncomment when using Workflows
  // RESUME_FEEDBACK_WORKFLOW: Workflow;
  // INTERVIEW_QUESTIONS_WORKFLOW: Workflow;
}

// D1 row types
export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  credit_limit: number;
  credit_used_adj: number;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: number;
  user_id: string;
  role: 'admin' | 'user' | 'employee' | 'employer';
  granted_at: string;
  granted_by: string | null;
}

export interface ResumeRow {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_hash: string;
  trade_program: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeFeedbackRow {
  id: string;
  user_id: string;
  resume_id: string;
  resume_hash: string;
  status: 'pending_review' | 'approved' | 'rejected';
  overall_score: number | null;
  strengths: string;
  improvements: string;
  suggestions: string;
  trade_suggestions: string;
  actionable_steps: string;
  score_breakdown: string | null;
  motivation_note: string | null;
  model_name: string | null;
  workflow_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestionsRow {
  id: string;
  user_id: string;
  resume_id: string | null;
  job_description: string;
  technical: string;
  behavioral: string;
  situational: string;
  recommended_resources: string;
  model_name: string | null;
  workflow_id: string | null;
  created_at: string;
}

export interface AIUsageRow {
  id: string;
  user_id: string;
  action_type: string;
  input_hash: string;
  workflow_id: string | null;
  model_name: string | null;
  created_at: string;
}

export interface TradeGradWaitlistRow {
  id: string;
  full_name: string;
  email: string;
  trade_program: string;
  state: string;
  city: string;
  consent: number;
  created_at: string;
}

export interface EmployerWaitlistRow {
  id: string;
  full_name: string;
  company_email: string;
  job_title: string | null;
  trades_hiring_for: string | null;
  hiring_volume: string | null;
  state: string;
  city: string;
  consent: number;
  created_at: string;
}

export interface ContactSubmissionRow {
  id: string;
  full_name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface NewsletterSubscriberRow {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: string | null;
  after_json: string | null;
  created_at: string;
}

// Auth context attached by middleware
export interface AuthContext {
  userId: string;
  email?: string;
}

// Career Fair - Company profiles
export interface CompanyRow {
  id: string;
  user_id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  industry: string | null;
  company_size: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null;
  description: string | null;
  city: string;
  state: string;
  is_partner: number;
  is_verified: number;
  status: 'pending_review' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

// Career Fair - Job listings
export interface JobListingRow {
  id: string;
  company_id: string;
  posted_by: string;
  title: string;
  description: string;
  trade_category: 'electrician' | 'hvac' | 'welding' | 'plumbing' | 'carpentry' | 'general';
  employment_type: 'full_time' | 'part_time' | 'contract' | 'apprenticeship';
  experience_level: 'entry' | 'mid' | 'senior' | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: 'hourly' | 'weekly' | 'monthly' | 'yearly' | null;
  city: string;
  state: string;
  is_remote: number;
  requirements: string; // JSON array
  benefits: string;     // JSON array
  application_deadline: string | null;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  is_featured: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

// Employer access requests (employee → employer upgrade)
export interface EmployerAccessRequestRow {
  id: string;
  user_id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  company_website: string | null;
  industry: string | null;
  company_size: string | null;
  description: string | null;
  city: string;
  state: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

// Career Fair - Job applications
export interface JobApplicationRow {
  id: string;
  job_id: string;
  user_id: string;
  resume_id: string | null;
  cover_letter: string | null;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
  employer_notes: string | null;
  created_at: string;
  updated_at: string;
}
