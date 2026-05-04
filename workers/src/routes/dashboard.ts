import { Hono } from 'hono';
import type { Env } from '../types';

const dashboard = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

// GET /api/user/dashboard - Batch summary for the dashboard
dashboard.get('/dashboard', async (c) => {
  const userId = c.get('userId');

  // Run all queries in parallel
  const [userRow, resumeRow, feedbackResults, questionsResults, usageResults] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<{ credit_limit: number; credit_used_adj: number }>(),
    c.env.DB.prepare('SELECT * FROM resumes WHERE user_id = ? AND is_active = 1').bind(userId).first(),
    c.env.DB.prepare('SELECT * FROM resume_feedback WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all(),
    c.env.DB.prepare('SELECT * FROM interview_questions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').bind(userId).all(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ?').bind(userId).first<{ count: number }>(),
  ]);

  const creditLimit = (userRow as any)?.credit_limit ?? 3;
  const effectiveUsed = Math.max(0, (usageResults?.count || 0) + ((userRow as any)?.credit_used_adj ?? 0));

  // Parse JSON fields in feedback
  const feedback = (feedbackResults.results || []).map((r: any) => ({
    ...r,
    strengths: JSON.parse(r.strengths || '[]'),
    improvements: JSON.parse(r.improvements || '[]'),
    suggestions: JSON.parse(r.suggestions || '[]'),
    trade_suggestions: JSON.parse(r.trade_suggestions || '[]'),
    actionable_steps: JSON.parse(r.actionable_steps || '[]'),
  }));

  // Parse JSON fields in questions
  const questions = (questionsResults.results || []).map((r: any) => ({
    ...r,
    technical: JSON.parse(r.technical || '[]'),
    behavioral: JSON.parse(r.behavioral || '[]'),
    situational: JSON.parse(r.situational || '[]'),
  }));

  return c.json({
    user: userRow,
    resume: resumeRow,
    feedback,
    latestQuestions: questions[0] || null,
    aiUsage: {
      used: effectiveUsed,
      max: creditLimit,
      remaining: Math.max(0, creditLimit - effectiveUsed),
    },
  });
});

// GET /api/user/profile - Get user profile
dashboard.get('/profile', async (c) => {
  const userId = c.get('userId');

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  const role = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(userId).first<{ role: string }>();

  return c.json({
    user,
    role: role?.role || 'user',
  });
});

export default dashboard;
