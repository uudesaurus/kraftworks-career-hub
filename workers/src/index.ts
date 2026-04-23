import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { clerkAuth, adminGuard } from './middleware/auth';
import resumeRoutes from './routes/resume';
import feedbackRoutes from './routes/feedback';
import questionsRoutes from './routes/questions';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';
import publicRoutes from './routes/public';
import webhookRoutes from './routes/webhook';
import publicJobRoutes from './routes/publicJobs';
import employerRoutes from './routes/employer';
import jobRoutes from './routes/jobs';

const app = new Hono<{ Bindings: Env }>();

// CORS - allow frontend origin
app.use('/api/*', cors({
  origin: (origin) => {
    // In production, restrict to your domain
    const allowed = [
      'https://kraftworks.com',
      'https://www.kraftworks.com',
      'https://career.kraftworks.app',
      'https://hiring.kraftworks.app',
      'https://kraftworks-career-hub.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
    ];
    // Also allow any *.vercel.app preview deployments
    if (origin && (allowed.includes(origin) || origin.endsWith('.vercel.app'))) return origin;
    // Allow any origin in development
    if (origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) return origin;
    return origin || '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Disposition'],
  maxAge: 86400,
  credentials: true,
}));

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Public routes (no auth required)
app.route('/api/public', publicRoutes);
app.route('/api/public/jobs', publicJobRoutes);

// Webhook routes (verified by SVIX signature, not Clerk JWT)
app.route('/api/webhook', webhookRoutes);

// Authenticated routes (Clerk JWT required)
app.use('/api/resume/*', clerkAuth);
app.use('/api/feedback/*', clerkAuth);
app.use('/api/questions/*', clerkAuth);
app.use('/api/user/*', clerkAuth);
app.use('/api/jobs/*', clerkAuth);

app.route('/api/resume', resumeRoutes);
app.route('/api/feedback', feedbackRoutes);
app.route('/api/questions', questionsRoutes);
app.route('/api/user', dashboardRoutes);
app.route('/api/jobs', jobRoutes);

// Employer routes (Clerk JWT required; employer guard applied per-route in the module)
app.use('/api/employer/*', clerkAuth);
app.route('/api/employer', employerRoutes);

// Admin routes (Clerk JWT + admin role required)
app.use('/api/admin/*', clerkAuth);
app.use('/api/admin/*', adminGuard);
app.route('/api/admin', adminRoutes);

// 404 fallback
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Global error handler
app.onError((err, c) => {
  console.error('Worker error:', err.message, err.stack);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;
