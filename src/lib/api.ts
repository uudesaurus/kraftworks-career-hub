// API client for Cloudflare Worker backend
// Replaces the Supabase client — all API calls go through the Worker

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthToken(): Promise<string | null> {
  // Clerk exposes useAuth().getToken() — but we can't use hooks outside React.
  // Instead, we access the Clerk instance directly via window.__clerk__
  // The token is injected by the ClerkProvider and accessible via Clerk's JS API.
  try {
    const clerk = (window as any).__clerk_frontend_api
      ? (window as any).Clerk
      : (window as any).__clerk;

    if (clerk?.session) {
      return await clerk.session.getToken();
    }

    // Fallback: try the Clerk publishable API
    if ((window as any).Clerk?.session) {
      return await (window as any).Clerk.session.getToken();
    }

    return null;
  } catch {
    return null;
  }
}

// We'll provide a setTokenGetter so React components can inject the real getToken
let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  _tokenGetter = getter;
}

async function resolveToken(): Promise<string | null> {
  if (_tokenGetter) return _tokenGetter();
  return getAuthToken();
}

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean; // default true for non-public routes
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = true } = options;

  const url = `${API_BASE_URL}${path}`;

  const requestHeaders: Record<string, string> = { ...headers };

  if (auth) {
    const token = await resolveToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const fetchOpts: RequestInit = {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };

  // Auto-retry on 503 (AI rate-limited) up to 2 times with delay
  let response: Response | null = null;
  for (let attempt = 0; attempt <= 2; attempt++) {
    response = await fetch(url, fetchOpts);

    if (response.status === 503 && attempt < 2) {
      const retryAfter = Number(response.headers.get('Retry-After') || '30');
      const delay = Math.min(retryAfter, 90) * 1000 + Math.random() * 5000;
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    break;
  }

  if (!response) throw new ApiError(0, 'No response from server');

  // Handle CSV/binary responses
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('text/csv') || contentType.includes('application/pdf')) {
    if (!response.ok) {
      throw new ApiError(response.status, `Request failed: ${response.statusText}`);
    }
    return response as any;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || `Request failed: ${response.statusText}`);
  }

  return data as T;
}

// ==================== Public API ====================

export const publicApi = {
  submitTradeGradWaitlist: (data: {
    full_name: string;
    email: string;
    trade_program: string;
    state: string;
    city: string;
    consent: boolean;
  }) => request('/api/public/waitlist/trade-grads', { method: 'POST', body: data, auth: false }),

  submitEmployerWaitlist: (data: {
    full_name: string;
    company_email: string;
    job_title?: string;
    trades_hiring_for?: string;
    hiring_volume?: string;
    state: string;
    city: string;
    consent: boolean;
  }) => request('/api/public/waitlist/employers', { method: 'POST', body: data, auth: false }),

  submitContact: (data: {
    full_name: string;
    email: string;
    subject?: string;
    message: string;
  }) => request('/api/public/contact', { method: 'POST', body: data, auth: false }),

  subscribeNewsletter: (email: string) =>
    request('/api/public/newsletter/subscribe', { method: 'POST', body: { email }, auth: false }),
};

// ==================== User API (authenticated) ====================

export const userApi = {
  getDashboard: () => request('/api/user/dashboard'),
  getProfile: () => request('/api/user/profile'),
};

// ==================== Resume API ====================

export const resumeApi = {
  getDetails: () => request('/api/resume/details'),

  upload: (file: File, tradeProgram?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (tradeProgram) formData.append('trade_program', tradeProgram);
    return request('/api/resume/upload', { method: 'POST', body: formData });
  },

  delete: (resumeId: string) =>
    request(`/api/resume/delete/${encodeURIComponent(resumeId)}`, { method: 'DELETE' }),
};

// ==================== Feedback API ====================

export const feedbackApi = {
  generate: () => request('/api/feedback/generate', { method: 'POST', body: {} }),
  list: () => request('/api/feedback/list'),
  delete: (id: string) => request(`/api/feedback/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  emailReport: (id: string) => request(`/api/feedback/${encodeURIComponent(id)}/email`, { method: 'POST', body: {} }),
};

// ==================== Questions API ====================

export const questionsApi = {
  generate: (jobDescription: string) =>
    request('/api/questions/generate', { method: 'POST', body: { job_description: jobDescription } }),
  list: () => request('/api/questions/list'),
  delete: (id: string) => request(`/api/questions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ==================== Admin API ====================

export const adminApi = {
  getFeedbackQueue: () => request('/api/admin/feedback/queue'),
  editFeedback: (id: string, data: Record<string, any>) =>
    request(`/api/admin/feedback/edit/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
  exportFeedbackCSV: () => request('/api/admin/feedback/export') as Promise<Response>,
  downloadResume: (resumeId: string) => request(`/api/admin/resume/download/${encodeURIComponent(resumeId)}`) as Promise<Response>,
  getTradeGrads: () => request('/api/admin/waitlist/trade-grads'),
  getEmployers: () => request('/api/admin/waitlist/employers'),
  exportWaitlistCSV: (type: 'trade_grads' | 'employers') =>
    request(`/api/admin/waitlist/export?type=${type}`) as Promise<Response>,
  getContacts: () => request('/api/admin/contacts'),
  updateContactStatus: (id: string, status: string) =>
    request(`/api/admin/contacts/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }),
  deleteContact: (id: string) =>
    request(`/api/admin/contacts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  deleteTradeGrad: (id: string) =>
    request(`/api/admin/waitlist/trade-grads/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  deleteEmployer: (id: string) =>
    request(`/api/admin/waitlist/employers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  addAdminRole: (userId: string) =>
    request('/api/admin/roles', { method: 'POST', body: { user_id: userId } }),
  removeAdminRole: (userId: string) =>
    request(`/api/admin/roles/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  setUserRole: (userId: string, role: string) =>
    request(`/api/admin/users/${encodeURIComponent(userId)}/role`, { method: 'PATCH', body: { role } }),
  setUserCreditLimit: (userId: string, creditLimit: number, notify = false) =>
    request(`/api/admin/users/${encodeURIComponent(userId)}/credits`, { method: 'PATCH', body: { credit_limit: creditLimit, notify } }),
  setUserCredits: (userId: string, aiActionsUsed: number, notify = false) =>
    request(`/api/admin/users/${encodeURIComponent(userId)}/credits-used`, { method: 'PATCH', body: { ai_actions_used: aiActionsUsed, notify } }),
  testEmail: (to: string) =>
    request('/api/admin/test-email', { method: 'POST', body: { to } }),
  getAuditLog: () => request('/api/admin/audit-log'),
  getUsers: () => request('/api/admin/users'),
  getUserDetail: (userId: string) => request(`/api/admin/users/${encodeURIComponent(userId)}`),
  exportUsersCSV: () => request('/api/admin/users/export') as Promise<Response>,

  // Career Fair Admin
  getCompanies: () => request('/api/admin/companies'),
  verifyCompany: (id: string) =>
    request(`/api/admin/companies/${encodeURIComponent(id)}/verify`, { method: 'PATCH' }),
  updateCompanyStatus: (id: string, status: string) =>
    request(`/api/admin/companies/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }),
  togglePartner: (id: string) =>
    request(`/api/admin/companies/${encodeURIComponent(id)}/partner`, { method: 'PATCH' }),
  getAllJobs: () => request('/api/admin/jobs'),
  moderateJob: (id: string, status: string) =>
    request(`/api/admin/jobs/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }),
  toggleFeatured: (id: string) =>
    request(`/api/admin/jobs/${encodeURIComponent(id)}/feature`, { method: 'PATCH' }),
  getAllApplications: () => request('/api/admin/job-applications'),
  getNewsletterSubscribers: () => request('/api/admin/newsletter/subscribers'),
  deleteSubscriber: (id: string) =>
    request(`/api/admin/newsletter/subscribers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  exportSubscribersCSV: () => request('/api/admin/newsletter/export') as Promise<Response>,

  // Employer Access Requests
  getEmployerRequests: () => request('/api/admin/employer-requests'),
  approveEmployerRequest: (id: string) =>
    request(`/api/admin/employer-requests/${encodeURIComponent(id)}/approve`, { method: 'PATCH' }),
  rejectEmployerRequest: (id: string, adminNotes?: string) =>
    request(`/api/admin/employer-requests/${encodeURIComponent(id)}/reject`, { method: 'PATCH', body: { admin_notes: adminNotes } }),
};

// ==================== Public Jobs API (no auth) ====================

export const publicJobsApi = {
  listJobs: (filters?: {
    search?: string;
    trade_category?: string;
    state?: string;
    employment_type?: string;
    company_id?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.trade_category) params.set('trade_category', filters.trade_category);
    if (filters?.state) params.set('state', filters.state);
    if (filters?.employment_type) params.set('employment_type', filters.employment_type);
    if (filters?.company_id) params.set('company_id', filters.company_id);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request(`/api/public/jobs${qs ? `?${qs}` : ''}`, { auth: false });
  },
  getJob: (id: string) => request(`/api/public/jobs/${encodeURIComponent(id)}`, { auth: false }),
  getCompany: (id: string) => request(`/api/public/jobs/companies/${encodeURIComponent(id)}`, { auth: false }),
};

// ==================== Employer API (authenticated) ====================

export const employerApi = {
  getCompany: () => request('/api/employer/company'),
  createCompany: (data: {
    company_name: string;
    company_email: string;
    company_phone?: string;
    company_website?: string;
    company_logo_url?: string;
    industry?: string;
    company_size?: string;
    description?: string;
    city: string;
    state: string;
  }) => request('/api/employer/company', { method: 'POST', body: data }),
  updateCompany: (data: Record<string, any>) =>
    request('/api/employer/company', { method: 'PUT', body: data }),

  listMyJobs: () => request('/api/employer/jobs'),
  createJob: (data: Record<string, any>) =>
    request('/api/employer/jobs', { method: 'POST', body: data }),
  getJob: (id: string) => request(`/api/employer/jobs/${encodeURIComponent(id)}`),
  updateJob: (id: string, data: Record<string, any>) =>
    request(`/api/employer/jobs/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
  deleteJob: (id: string) =>
    request(`/api/employer/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  listApplications: (jobId: string) =>
    request(`/api/employer/jobs/${encodeURIComponent(jobId)}/applications`),
  updateApplicationStatus: (appId: string, data: { status?: string; employer_notes?: string }) =>
    request(`/api/employer/applications/${encodeURIComponent(appId)}/status`, { method: 'PATCH', body: data }),

  getDashboard: () => request('/api/employer/dashboard'),

  // Employer access request flow
  roleCheck: () => request('/api/employer/role-check'),
  getAccessRequest: () => request('/api/employer/access-request'),
  submitAccessRequest: (data: {
    company_name: string;
    company_email: string;
    company_phone?: string;
    company_website?: string;
    industry?: string;
    company_size?: string;
    description?: string;
    city: string;
    state: string;
  }) => request('/api/employer/access-request', { method: 'POST', body: data }),
};

// ==================== Job Seeker API (authenticated) ====================

export const jobSeekerApi = {
  applyToJob: (jobId: string, data?: { resume_id?: string; cover_letter?: string }) =>
    request(`/api/jobs/${encodeURIComponent(jobId)}/apply`, { method: 'POST', body: data || {} }),
  getApplicationStatus: (jobId: string) =>
    request(`/api/jobs/${encodeURIComponent(jobId)}/application-status`),
  listMyApplications: () => request('/api/jobs/my-applications'),
  withdrawApplication: (id: string) =>
    request(`/api/jobs/applications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export { ApiError };
