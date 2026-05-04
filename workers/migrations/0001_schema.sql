-- Kraftworks Career Hub - D1 Schema Migration
-- All 12 tables per PRD ERD specification

-- 1. Users (synced from Clerk via webhook)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- Clerk user ID
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  granted_by TEXT,
  UNIQUE(user_id, role)
);

-- 3. Resumes
CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,            -- R2 key: {user_id}/{resume_id}/{filename}
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL,            -- SHA-256
  trade_program TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id)                     -- One active resume per user
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);

-- 4. Resume Feedback
CREATE TABLE IF NOT EXISTS resume_feedback (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  resume_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_review', 'approved', 'rejected')) DEFAULT 'pending_review',
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 10),
  strengths TEXT DEFAULT '[]',        -- JSON array
  improvements TEXT DEFAULT '[]',     -- JSON array
  suggestions TEXT DEFAULT '[]',      -- JSON array
  trade_suggestions TEXT DEFAULT '[]',-- JSON array
  actionable_steps TEXT DEFAULT '[]', -- JSON array
  model_name TEXT,
  workflow_id TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON resume_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON resume_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_resume ON resume_feedback(resume_id);

-- 5. Interview Questions
CREATE TABLE IF NOT EXISTS interview_questions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,
  job_description TEXT NOT NULL,
  technical TEXT DEFAULT '[]',        -- JSON array
  behavioral TEXT DEFAULT '[]',       -- JSON array
  situational TEXT DEFAULT '[]',      -- JSON array
  model_name TEXT,
  workflow_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_questions_user ON interview_questions(user_id);

-- 6. AI Usage (deduplication + quota tracking)
CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('resume_feedback', 'interview_questions')),
  input_hash TEXT NOT NULL,           -- SHA-256 of action_type:input
  workflow_id TEXT,
  model_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, action_type, input_hash)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);

-- 7. Trade Grad Waitlist
CREATE TABLE IF NOT EXISTS trade_grad_waitlist (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  trade_program TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  consent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Employer Waitlist
CREATE TABLE IF NOT EXISTS employer_waitlist (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  full_name TEXT NOT NULL,
  company_email TEXT NOT NULL UNIQUE,
  job_title TEXT,
  trades_hiring_for TEXT,
  hiring_volume TEXT,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  consent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. Contact Submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'resolved')) DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contact_submissions(status);

-- 10. Admin Audit Log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT,                   -- JSON snapshot before change
  after_json TEXT,                    -- JSON snapshot after change
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON admin_audit_log(actor_user_id);

-- 11. Email Events (optional tracking)
CREATE TABLE IF NOT EXISTS email_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. Workflow Runs (optional tracking)
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workflow_name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'running',
  input_json TEXT,
  output_json TEXT,
  error_message TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_user ON workflow_runs(user_id);
