import { Hono } from 'hono';
import type { Env } from '../types';

const webhook = new Hono<{ Bindings: Env }>();

// POST /api/webhook/clerk - Clerk webhook for user sync
webhook.post('/clerk', async (c) => {
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing SVIX headers' }, 400);
  }

  const rawBody = await c.req.text();

  // Verify SVIX webhook signature
  const isValid = await verifySvixSignature(
    rawBody,
    svixId,
    svixTimestamp,
    svixSignature,
    c.env.CLERK_WEBHOOK_SECRET,
  );

  if (!isValid) {
    return c.json({ error: 'Invalid webhook signature' }, 401);
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload.type;
  const data = payload.data;

  switch (eventType) {
    case 'user.created': {
      const userId = data.id;
      const email = data.email_addresses?.[0]?.email_address || '';
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

      await c.env.DB.prepare(`
        INSERT INTO users (id, email, full_name) VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET email = ?, full_name = ?, updated_at = datetime('now')
      `).bind(userId, email, fullName, email, fullName).run();

      // Auto-assign 'user' role
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, 'user')
      `).bind(userId).run();
      break;
    }

    case 'user.updated': {
      const userId = data.id;
      const email = data.email_addresses?.[0]?.email_address || '';
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

      await c.env.DB.prepare(`
        UPDATE users SET email = ?, full_name = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(email, fullName, userId).run();
      break;
    }

    case 'user.deleted': {
      const userId = data.id;
      // D1 cascading deletes handle related records
      await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
      break;
    }

    default:
      // Ignore unknown events
      break;
  }

  return c.json({ received: true });
});

// SVIX signature verification
async function verifySvixSignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string,
): Promise<boolean> {
  try {
    // The secret from Clerk starts with "whsec_"
    const secretBytes = base64ToUint8Array(secret.replace('whsec_', ''));

    // Construct the signed content
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

    // Compute HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
    const computedSignature = uint8ArrayToBase64(new Uint8Array(signatureBytes));

    // Svix sends multiple signatures separated by space, each prefixed with "v1,"
    const expectedSignatures = svixSignature.split(' ').map(s => s.replace('v1,', ''));

    return expectedSignatures.some(sig => sig === computedSignature);
  } catch {
    return false;
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default webhook;
