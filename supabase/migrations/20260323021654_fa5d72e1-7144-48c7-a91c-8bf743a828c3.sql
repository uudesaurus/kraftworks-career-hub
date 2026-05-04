
-- Trade Grad Waitlist
CREATE TABLE public.trade_grad_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  trade_program text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_grad_waitlist ENABLE ROW LEVEL SECURITY;

-- Public insert (no auth needed for waitlist)
CREATE POLICY "Anyone can join trade grad waitlist" ON public.trade_grad_waitlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin can view all
CREATE POLICY "Admins can view trade grad waitlist" ON public.trade_grad_waitlist
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Employer Waitlist
CREATE TABLE public.employer_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  job_title text NOT NULL,
  company_email text NOT NULL,
  trades_hiring_for text NOT NULL,
  hiring_volume text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_waitlist ENABLE ROW LEVEL SECURITY;

-- Public insert
CREATE POLICY "Anyone can join employer waitlist" ON public.employer_waitlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin can view all
CREATE POLICY "Admins can view employer waitlist" ON public.employer_waitlist
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add trade_program column to resumes for specialization tracking
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS trade_program text;

-- Add overall_score and trade_specific_suggestions to resume_feedback
ALTER TABLE public.resume_feedback ADD COLUMN IF NOT EXISTS overall_score integer;
ALTER TABLE public.resume_feedback ADD COLUMN IF NOT EXISTS trade_suggestions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.resume_feedback ADD COLUMN IF NOT EXISTS actionable_steps jsonb DEFAULT '[]'::jsonb;
