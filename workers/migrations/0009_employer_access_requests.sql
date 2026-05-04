-- Employer access request table: employees request to become employers
-- Admin reviews and approves/rejects these requests
CREATE TABLE IF NOT EXISTS employer_access_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_phone TEXT,
  company_website TEXT,
  industry TEXT,
  company_size TEXT,
  description TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employer_access_requests_user ON employer_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_access_requests_status ON employer_access_requests(status);
