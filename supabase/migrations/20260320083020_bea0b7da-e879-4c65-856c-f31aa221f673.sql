
CREATE TABLE public.resume_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  resume_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review',
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  improvements jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.resume_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.resume_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
