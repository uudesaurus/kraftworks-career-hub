import { Hono } from 'hono';
import type { Env, ResumeRow, InterviewQuestionsRow, UserRow } from '../types';
import {
  callAI,
  buildInterviewQuestionsMessages,
  interviewQuestionsTool,
  isSandbox,
  mockAICall,
} from '../lib/openrouter';
import { sendEmail, interviewQuestionsReadyEmail } from '../lib/resend';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const questions = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

// POST /api/questions/generate - Generate AI interview questions
questions.post('/generate', async (c) => {
  const userId = c.get('userId');

  const body = await c.req.json<{ job_description: string }>();
  const jobDescription = body.job_description?.trim();

  if (!jobDescription || jobDescription.length < 10) {
    return c.json({ error: 'Job description must be at least 10 characters.' }, 400);
  }

  if (jobDescription.length > 2000) {
    return c.json({ error: 'Job description must be under 2000 characters.' }, 400);
  }

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

  // Get active resume (optional but enriches the result)
  const resume = await c.env.DB.prepare(
    'SELECT * FROM resumes WHERE user_id = ? AND is_active = 1'
  ).bind(userId).first<ResumeRow>();

  // Use a per-attempt hash so users can regenerate and keep full history.
  const hashInput = resume ? `interview_questions:${jobDescription}:${resume.file_hash}` : `interview_questions:${jobDescription}`;
  const inputHash = await computeHash(`${hashInput}:${Date.now()}:${crypto.randomUUID()}`);

  // Get resume PDF if available (send as inline data to Gemini)
  let pdfBase64: string | undefined;
  if (resume) {
    const r2Object = await c.env.RESUMES_BUCKET.get(resume.file_path);
    if (r2Object) {
      const buffer = await r2Object.arrayBuffer();
      pdfBase64 = arrayBufferToBase64(buffer);
    }
  }

  // Call Gemini for AI question generation (or use mock in sandbox)
  let aiResult: any;
  let modelName: string;

  if (isSandbox(c.env)) {
    const mock = mockAICall('provide_interview_questions');
    aiResult = mock.content;
    modelName = mock.model;
  } else {
    try {
      const messages = buildInterviewQuestionsMessages(jobDescription, pdfBase64 ? '(PDF attached below)' : undefined, resume?.trade_program ?? undefined);
      const inlineData = pdfBase64 ? [{ mimeType: 'application/pdf', data: pdfBase64 }] : undefined;
      const result = await callAI(
        c.env.OPENROUTER_API_KEY,
        {
          messages,
          tools: [interviewQuestionsTool],
          tool_choice: { type: 'function', function: { name: 'provide_interview_questions' } },
          inlineData,
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

  const questionId = crypto.randomUUID().replace(/-/g, '');

  // Persist in D1
  await c.env.DB.prepare(`
    INSERT INTO interview_questions (id, user_id, resume_id, job_description, technical, behavioral, situational, recommended_resources, model_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    questionId,
    userId,
    resume?.id || null,
    jobDescription,
    JSON.stringify(aiResult.technical || []),
    JSON.stringify(aiResult.behavioral || []),
    JSON.stringify(aiResult.situational || []),
    JSON.stringify(aiResult.recommended_resources || []),
    modelName,
  ).run();

  // Record AI usage
  await c.env.DB.prepare(`
    INSERT INTO ai_usage (id, user_id, action_type, input_hash, model_name)
    VALUES (?, ?, 'interview_questions', ?, ?)
  `).bind(crypto.randomUUID().replace(/-/g, ''), userId, inputHash, modelName).run();

  // Email: interview questions ready
  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
    if (user?.email) {
      const tpl = interviewQuestionsReadyEmail(user.full_name || 'there', jobDescription);
      sendEmail(c.env.RESEND_API_KEY, { to: user.email, subject: tpl.subject, html: tpl.html }, c.env.SANDBOX_MODE === 'true').catch(() => {});
    }
  } catch { /* non-blocking */ }

  // Return the question record
  const questionRow = await c.env.DB.prepare(
    'SELECT * FROM interview_questions WHERE id = ?'
  ).bind(questionId).first<InterviewQuestionsRow>();

  return c.json({
    questions: questionRow ? {
      ...questionRow,
      technical: JSON.parse(questionRow.technical),
      behavioral: JSON.parse(questionRow.behavioral),
      situational: JSON.parse(questionRow.situational),
      recommended_resources: JSON.parse(questionRow.recommended_resources || '[]'),
    } : null,
    trade_notice: aiResult.trade_notice || null,
  }, 201);
});

// GET /api/questions/list - Get user's interview questions
questions.get('/list', async (c) => {
  const userId = c.get('userId');

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM interview_questions WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all<InterviewQuestionsRow>();

  const parsed = (results || []).map(r => ({
    ...r,
    technical: JSON.parse(r.technical),
    behavioral: JSON.parse(r.behavioral),
    situational: JSON.parse(r.situational),
    recommended_resources: JSON.parse(r.recommended_resources || '[]'),
  }));

  return c.json({ questions: parsed });
});

// DELETE /api/questions/:id - Delete user's own question set
questions.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const questionId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM interview_questions WHERE id = ? AND user_id = ?'
  ).bind(questionId, userId).first();

  if (!existing) return c.json({ error: 'Question set not found' }, 404);

  await c.env.DB.prepare('DELETE FROM interview_questions WHERE id = ? AND user_id = ?')
    .bind(questionId, userId).run();

  return c.json({ success: true });
});

async function computeHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default questions;
