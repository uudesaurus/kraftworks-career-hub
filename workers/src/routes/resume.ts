import { Hono } from 'hono';
import type { Env, ResumeRow } from '../types';

const resume = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

// POST /api/resume/upload - Upload resume (PDF) to R2
resume.post('/upload', async (c) => {
  const userId = c.get('userId');

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const tradeProgram = formData.get('trade_program') as string | null;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    return c.json({ error: 'Only PDF files are accepted' }, 400);
  }

  // Validate file size (2MB max)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return c.json({ error: 'File must be under 2MB' }, 400);
  }

  // Generate resume ID and compute hash
  const resumeId = crypto.randomUUID().replace(/-/g, '');
  const fileBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
  const fileHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // R2 path
  const r2Key = `${userId}/${resumeId}/${file.name}`;

  // Delete existing resume if any (replace)
  const existing = await c.env.DB.prepare(
    'SELECT id, file_path FROM resumes WHERE user_id = ? AND is_active = 1'
  ).bind(userId).first<ResumeRow>();

  if (existing) {
    // Explicitly delete old feedback (D1 doesn't enforce ON DELETE CASCADE)
    await c.env.DB.prepare(
      'DELETE FROM resume_feedback WHERE resume_id = ?'
    ).bind(existing.id).run();
    // Delete old file from R2
    await c.env.RESUMES_BUCKET.delete(existing.file_path);
    // Delete old record (UNIQUE(user_id) constraint means we must remove, not just deactivate)
    await c.env.DB.prepare(
      'DELETE FROM resumes WHERE id = ?'
    ).bind(existing.id).run();
  }

  // Upload to R2
  await c.env.RESUMES_BUCKET.put(r2Key, fileBuffer, {
    httpMetadata: { contentType: 'application/pdf' },
    customMetadata: { userId, originalName: file.name },
  });

  // Insert into D1
  await c.env.DB.prepare(`
    INSERT INTO resumes (id, user_id, file_name, file_path, file_size, file_hash, trade_program)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(resumeId, userId, file.name, r2Key, file.size, fileHash, tradeProgram).run();

  const newResume = await c.env.DB.prepare(
    'SELECT * FROM resumes WHERE id = ?'
  ).bind(resumeId).first<ResumeRow>();

  return c.json({ resume: newResume }, 201);
});

// DELETE /api/resume/delete/:resumeId - Delete a resume
resume.delete('/delete/:resumeId', async (c) => {
  const userId = c.get('userId');
  const resumeId = c.req.param('resumeId');

  const existing = await c.env.DB.prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).bind(resumeId, userId).first<ResumeRow>();

  if (!existing) {
    return c.json({ error: 'Resume not found' }, 404);
  }

  // Delete from R2
  await c.env.RESUMES_BUCKET.delete(existing.file_path);

  // Delete from D1 (cascades to feedback, questions)
  await c.env.DB.prepare('DELETE FROM resumes WHERE id = ?').bind(resumeId).run();

  return c.json({ success: true });
});

// GET /api/resume/details - Get current user's active resume
resume.get('/details', async (c) => {
  const userId = c.get('userId');

  const resumeRow = await c.env.DB.prepare(
    'SELECT * FROM resumes WHERE user_id = ? AND is_active = 1'
  ).bind(userId).first<ResumeRow>();

  return c.json({ resume: resumeRow || null });
});

export default resume;
