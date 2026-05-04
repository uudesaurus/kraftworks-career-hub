-- Career Fair Job Board - Schema Migration
-- Adds companies, job_listings, and job_applications tables
-- Expands user_roles to support 'employer' role

-- 1. Expand user_roles role constraint to include 'employer'
-- SQLite doesn't support ALTER CHECK, so we recreate the table
CREATE TABLE IF NOT EXISTS user_roles_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'employer')) DEFAULT 'user',
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  granted_by TEXT,
  UNIQUE(user_id, role)
);

INSERT OR IGNORE INTO user_roles_new (id, user_id, role, granted_at, granted_by)
  SELECT id, user_id, role, granted_at, granted_by FROM user_roles;

DROP TABLE IF EXISTS user_roles;
ALTER TABLE user_roles_new RENAME TO user_roles;

-- 2. Companies (employer profiles)
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_phone TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  description TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_partner INTEGER NOT NULL DEFAULT 0,
  is_verified INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- 3. Job Listings
CREATE TABLE IF NOT EXISTS job_listings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  posted_by TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  trade_category TEXT NOT NULL CHECK (trade_category IN ('electrician', 'hvac', 'welding', 'plumbing', 'carpentry', 'general')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'apprenticeship')),
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior')),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_period TEXT CHECK (salary_period IN ('hourly', 'weekly', 'monthly', 'yearly')),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_remote INTEGER NOT NULL DEFAULT 0,
  requirements TEXT NOT NULL DEFAULT '[]',
  benefits TEXT NOT NULL DEFAULT '[]',
  application_deadline TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed', 'expired')),
  is_featured INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON job_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_trade ON job_listings(trade_category);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_jobs_state ON job_listings(state);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON job_listings(posted_by);

-- 4. Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  job_id TEXT NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')),
  employer_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);
