import { Context, Next } from 'hono';
import type { Env } from '../types';

/**
 * Middleware: requires 'employer' or 'admin' role.
 * Must be applied AFTER clerkAuth (needs userId in context).
 */
export async function employerGuard(
  c: Context<{ Bindings: Env; Variables: { userId: string } }>,
  next: Next
) {
  const userId = c.get('userId');

  const role = await c.env.DB.prepare(
    "SELECT role FROM user_roles WHERE user_id = ? AND role IN ('employer', 'admin') LIMIT 1"
  ).bind(userId).first<{ role: string }>();

  if (!role) {
    return c.json({ error: 'Forbidden: Employer access required' }, 403);
  }

  return next();
}
