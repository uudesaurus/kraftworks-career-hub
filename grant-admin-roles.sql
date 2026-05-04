-- Grant admin roles to Vinny and Mahmud
-- Run this via: wrangler d1 execute kraftworks-db --file=grant-admin-roles.sql --remote

-- Vinny (vinny@kraftworks.app)
INSERT OR IGNORE INTO user_roles (user_id, role, granted_at, granted_by)
VALUES ('user_3BkmSL8CG4JoX8RcCFiDXBOigbO', 'admin', datetime('now'), 'system');

-- Mahmud (mahmudasrul11@gmail.com)
INSERT OR IGNORE INTO user_roles (user_id, role, granted_at, granted_by)
VALUES ('user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'admin', datetime('now'), 'system');

-- Verify
SELECT u.email, u.full_name, ur.role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'admin'
WHERE u.email IN ('vinny@kraftworks.app', 'mahmudasrul11@gmail.com');
