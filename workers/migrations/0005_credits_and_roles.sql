-- Add credit_limit to users (default 3 to match existing hardcoded max)
ALTER TABLE users ADD COLUMN credit_limit INTEGER NOT NULL DEFAULT 3;

-- Recreate user_roles with expanded role CHECK constraint (employee, employer)
CREATE TABLE IF NOT EXISTS user_roles_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'employee', 'employer')) DEFAULT 'user',
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  granted_by TEXT,
  UNIQUE(user_id, role)
);

INSERT INTO user_roles_new (id, user_id, role, granted_at, granted_by)
  SELECT id, user_id, role, granted_at, granted_by FROM user_roles;

DROP TABLE user_roles;
ALTER TABLE user_roles_new RENAME TO user_roles;
