/**
 * Returns all email addresses of users with admin role.
 * Falls back to a configured ADMIN_EMAIL env var if no admin users exist in DB.
 */
export async function getAdminEmails(
  db: D1Database,
  adminEmailEnv?: string,
): Promise<string[]> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT u.email FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE ur.role = 'admin' AND u.email IS NOT NULL AND u.email != ''`
    )
    .all<{ email: string }>();

  const dbEmails = (results || []).map((r) => r.email).filter(Boolean);

  // If no admins in DB, fall back to env var (for initial setup)
  if (dbEmails.length === 0 && adminEmailEnv) {
    return [adminEmailEnv];
  }

  return dbEmails;
}
