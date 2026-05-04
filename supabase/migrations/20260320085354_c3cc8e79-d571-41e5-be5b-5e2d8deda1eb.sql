
CREATE TABLE public.interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_description text NOT NULL,
  technical jsonb NOT NULL DEFAULT '[]'::jsonb,
  behavioral jsonb NOT NULL DEFAULT '[]'::jsonb,
  situational jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questions" ON public.interview_questions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questions" ON public.interview_questions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
