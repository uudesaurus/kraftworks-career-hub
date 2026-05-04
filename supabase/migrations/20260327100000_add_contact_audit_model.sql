-- Contact Submissions table (public form, admin-managed inbox)
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contact_submissions_status_date ON public.contact_submissions (status, created_at);

-- Anyone can submit a contact form (public, unauthenticated)
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admins can view all contact submissions
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Admins can update contact submission status
CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Admin Audit Log table (immutable record of admin actions)
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_log_entity ON public.admin_audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON public.admin_audit_log (actor_user_id);

-- Admins can insert audit records
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can view audit log
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add model_name column to resume_feedback (tracks which AI model was used)
ALTER TABLE public.resume_feedback ADD COLUMN IF NOT EXISTS model_name text;
