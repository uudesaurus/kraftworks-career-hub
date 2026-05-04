import { Hono } from 'hono';
import type { Env, ResumeRow, ResumeFeedbackRow } from '../types';
import {
  callAI,
  buildResumeFeedbackMessages,
  resumeFeedbackTool,
  isSandbox,
  mockAICall,
} from '../lib/openrouter';
import { sendEmail, adminResumeNotificationEmail, feedbackReportEmail } from '../lib/resend';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const feedback = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

// POST /api/feedback/generate - Generate AI resume feedback
feedback.post('/generate', async (c) => {
  const userId = c.get('userId');

  // Check AI usage quota
  const [usageCount, userRow] = await Promise.all([
    c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ?'
    ).bind(userId).first<{ count: number }>(),
    c.env.DB.prepare(
      'SELECT credit_limit, credit_used_adj FROM users WHERE id = ?'
    ).bind(userId).first<{ credit_limit: number; credit_used_adj: number }>(),
  ]);

  const creditLimit = userRow?.credit_limit ?? 3;
  const effectiveUsed = Math.max(0, (usageCount?.count ?? 0) + (userRow?.credit_used_adj ?? 0));

  if (effectiveUsed >= creditLimit) {
    return c.json({ error: `You have reached the maximum of ${creditLimit} AI actions.` }, 429);
  }

  // Get active resume
  const resume = await c.env.DB.prepare(
    'SELECT * FROM resumes WHERE user_id = ? AND is_active = 1'
  ).bind(userId).first<ResumeRow>();

  if (!resume) {
    return c.json({ error: 'No resume uploaded. Please upload a resume first.' }, 400);
  }

  // Use a per-attempt hash so users can regenerate and keep full history.
  const inputHash = await computeHash(`resume_feedback:${resume.file_hash}:${Date.now()}:${crypto.randomUUID()}`);

  // Fetch resume PDF from R2
  const r2Object = await c.env.RESUMES_BUCKET.get(resume.file_path);
  if (!r2Object) {
    return c.json({ error: 'Resume file not found in storage.' }, 404);
  }

  const resumeBuffer = await r2Object.arrayBuffer();

  // Call Gemini for AI feedback (or use mock in sandbox)
  let aiResult: any;
  let modelName: string;

  if (isSandbox(c.env)) {
    const mock = mockAICall('provide_resume_feedback');
    aiResult = mock.content;
    modelName = mock.model;
  } else {
    try {
      // Send PDF as base64 inline data — Gemini natively processes PDFs
      const pdfBase64 = arrayBufferToBase64(resumeBuffer);
      const messages = buildResumeFeedbackMessages('(PDF attached below)', resume.trade_program || undefined);
      const result = await callAI(
        c.env.OPENROUTER_API_KEY,
        {
          messages,
          tools: [resumeFeedbackTool],
          tool_choice: { type: 'function', function: { name: 'provide_resume_feedback' } },
          inlineData: [{ mimeType: 'application/pdf', data: pdfBase64 }],
        },
      );
      aiResult = result.content;
      modelName = result.model;
    } catch (aiErr: any) {
      console.error('Gemini API error:', aiErr.message || aiErr);
      const isCapacity = aiErr.message?.includes('capacity');
      return c.json(
        { error: `AI processing failed: ${aiErr.message || 'Unknown error'}`, retryable: isCapacity },
        isCapacity ? 503 : 502,
        isCapacity ? { 'Retry-After': '60' } : undefined,
      );
    }
  }

  // Clamp scores to floor of 6 (never show below 6)
  const clampedScore = aiResult.overall_score ? Math.max(6, aiResult.overall_score) : null;
  if (aiResult.score_breakdown) {
    for (const key of ['formatting', 'content', 'trade_relevance', 'impact'] as const) {
      if (typeof (aiResult.score_breakdown as any)[key] === 'number') {
        (aiResult.score_breakdown as any)[key] = Math.max(6, (aiResult.score_breakdown as any)[key]);
      }
    }
  }

  // Generate IDs
  const feedbackId = crypto.randomUUID().replace(/-/g, '');

  // Persist feedback in D1
  await c.env.DB.prepare(`
    INSERT INTO resume_feedback (id, user_id, resume_id, resume_hash, status, overall_score, strengths, improvements, suggestions, trade_suggestions, actionable_steps, score_breakdown, motivation_note, model_name)
    VALUES (?, ?, ?, ?, 'pending_review', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    feedbackId,
    userId,
    resume.id,
    resume.file_hash,
    clampedScore,
    JSON.stringify(aiResult.strengths || []),
    JSON.stringify(aiResult.improvements || []),
    JSON.stringify(aiResult.suggestions || []),
    JSON.stringify(aiResult.trade_suggestions || []),
    JSON.stringify(aiResult.actionable_steps || []),
    aiResult.score_breakdown ? JSON.stringify(aiResult.score_breakdown) : null,
    aiResult.motivation_note || null,
    modelName,
  ).run();

  // Record AI usage
  await c.env.DB.prepare(`
    INSERT INTO ai_usage (id, user_id, action_type, input_hash, model_name)
    VALUES (?, ?, 'resume_feedback', ?, ?)
  `).bind(crypto.randomUUID().replace(/-/g, ''), userId, inputHash, modelName).run();

  // Send admin notification email (fire-and-forget)
  const user = await c.env.DB.prepare('SELECT full_name, email FROM users WHERE id = ?').bind(userId).first<{ full_name: string; email: string }>();
  if (user && c.env.ADMIN_EMAIL) {
    const emailContent = adminResumeNotificationEmail(user.full_name || user.email, resume.file_name);
    sendEmail(c.env.RESEND_API_KEY, {
      to: c.env.ADMIN_EMAIL,
      ...emailContent,
    }, isSandbox(c.env)).catch(() => {}); // Fire-and-forget
  }

  // Return the feedback record
  const feedbackRow = await c.env.DB.prepare(
    'SELECT * FROM resume_feedback WHERE id = ?'
  ).bind(feedbackId).first<ResumeFeedbackRow>();

  return c.json({
    feedback: feedbackRow ? {
      ...feedbackRow,
      strengths: JSON.parse(feedbackRow.strengths),
      improvements: JSON.parse(feedbackRow.improvements),
      suggestions: JSON.parse(feedbackRow.suggestions),
      trade_suggestions: JSON.parse(feedbackRow.trade_suggestions),
      actionable_steps: JSON.parse(feedbackRow.actionable_steps),
      score_breakdown: feedbackRow.score_breakdown ? JSON.parse(feedbackRow.score_breakdown) : null,
    } : null,
  }, 201);
});

// GET /api/feedback/list - Get user's feedback records
feedback.get('/list', async (c) => {
  const userId = c.get('userId');

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM resume_feedback WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all<ResumeFeedbackRow>();

  const parsed = (results || []).map(r => ({
    ...r,
    strengths: JSON.parse(r.strengths),
    improvements: JSON.parse(r.improvements),
    suggestions: JSON.parse(r.suggestions),
    trade_suggestions: JSON.parse(r.trade_suggestions),
    actionable_steps: JSON.parse(r.actionable_steps),
    score_breakdown: r.score_breakdown ? JSON.parse(r.score_breakdown) : null,
  }));

  return c.json({ feedback: parsed });
});

// DELETE /api/feedback/:id - Delete user's own feedback
feedback.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const feedbackId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM resume_feedback WHERE id = ? AND user_id = ?'
  ).bind(feedbackId, userId).first();

  if (!existing) return c.json({ error: 'Feedback not found' }, 404);

  await c.env.DB.prepare('DELETE FROM resume_feedback WHERE id = ? AND user_id = ?')
    .bind(feedbackId, userId).run();

  return c.json({ success: true });
});

// POST /api/feedback/:id/email - Email feedback report to user
feedback.post('/:id/email', async (c) => {
  const userId = c.get('userId');
  const feedbackId = c.req.param('id');

  const [feedbackRow, user] = await Promise.all([
    c.env.DB.prepare(
      'SELECT * FROM resume_feedback WHERE id = ? AND user_id = ?'
    ).bind(feedbackId, userId).first<ResumeFeedbackRow>(),
    c.env.DB.prepare(
      'SELECT full_name, email FROM users WHERE id = ?'
    ).bind(userId).first<{ full_name: string; email: string }>(),
  ]);

  if (!feedbackRow) return c.json({ error: 'Feedback not found' }, 404);
  if (!user?.email) return c.json({ error: 'No email address found' }, 400);

  const parsed = {
    ...feedbackRow,
    strengths: JSON.parse(feedbackRow.strengths),
    improvements: JSON.parse(feedbackRow.improvements),
    suggestions: JSON.parse(feedbackRow.suggestions),
    trade_suggestions: JSON.parse(feedbackRow.trade_suggestions),
    actionable_steps: JSON.parse(feedbackRow.actionable_steps),
    score_breakdown: feedbackRow.score_breakdown ? JSON.parse(feedbackRow.score_breakdown) : null,
  };

  const emailContent = feedbackReportEmail(user.full_name || 'there', parsed);
  const result = await sendEmail(c.env.RESEND_API_KEY, {
    to: user.email,
    ...emailContent,
  }, isSandbox(c.env));

  if (!result) return c.json({ error: 'Failed to send email' }, 502);
  return c.json({ success: true, email: user.email });
});

// Helper: compute SHA-256 hash
async function computeHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default feedback;
