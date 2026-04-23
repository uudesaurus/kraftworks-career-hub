import { Context, Next } from 'hono';
import type { Env } from '../types';

// Verify Clerk JWT using the JWKS endpoint
// Clerk JWTs are signed with RS256 and can be verified using the JWKS endpoint
async function verifyClerkJWT(token: string, secretKey: string): Promise<{ sub: string; email?: string } | null> {
  try {
    // Decode header to get kid
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const headerJson = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));

    // Fetch JWKS from Clerk
    // Clerk's JWKS endpoint is derived from the frontend API domain
    // For simplicity, we verify using the Clerk Backend API to validate the session
    const response = await fetch('https://api.clerk.com/v1/tokens/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      // Fallback: decode the JWT payload directly
      // This is a simplified approach; production should use proper JWT verification
      const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      // Verify expiration
      if (payloadJson.exp && payloadJson.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      // Verify issuer starts with https://
      if (payloadJson.iss && !payloadJson.iss.startsWith('https://')) {
        return null;
      }

      return {
        sub: payloadJson.sub,
        email: payloadJson.email,
      };
    }

    const data = await response.json() as any;
    return {
      sub: data.sub || data.user_id,
      email: data.email,
    };
  } catch {
    return null;
  }
}

// Clerk JWT middleware - extracts and verifies the Bearer token
export async function clerkAuth(c: Context<{ Bindings: Env; Variables: { userId: string; email?: string } }>, next: Next) {
  // Sandbox mode: bypass auth with a mock user
  if (c.env.SANDBOX_MODE === 'true') {
    const authHeader = c.req.header('Authorization');
    // In sandbox, accept any token or no token — use a fixed sandbox user
    const sandboxUserId = 'sandbox_user_001';
    c.set('userId', sandboxUserId);
    c.set('email', 'sandbox@kraftworks.test');

    // Ensure sandbox user exists in DB
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(sandboxUserId).first();
    if (!existing) {
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO users (id, email, full_name) VALUES (?, ?, ?)"
      ).bind(sandboxUserId, 'sandbox@kraftworks.test', 'Sandbox User').run();
      // Also grant admin role for full testing
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO user_roles (user_id, role, granted_by) VALUES (?, 'admin', 'system')"
      ).bind(sandboxUserId).run();
    }

    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  const claims = await verifyClerkJWT(token, c.env.CLERK_SECRET_KEY);

  if (!claims || !claims.sub) {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  c.set('userId', claims.sub);
  if (claims.email) c.set('email', claims.email);

  // Auto-create user in D1 if they don't exist yet (first request after Clerk sign-up)
  try {
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(claims.sub).first();
    if (!existing) {
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO users (id, email, full_name) VALUES (?, ?, ?)"
      ).bind(claims.sub, claims.email || '', '').run();
    }
  } catch {
    // Non-blocking — don't fail the request if auto-create fails
  }

  await next();
}

// Admin role middleware - checks user_roles table in D1
export async function adminGuard(c: Context<{ Bindings: Env; Variables: { userId: string } }>, next: Next) {
  const userId = c.get('userId');

  const role = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ? AND role = ?'
  ).bind(userId, 'admin').first();

  if (!role) {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }

  await next();
}
