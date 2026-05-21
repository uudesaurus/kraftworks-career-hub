import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CompanyBadge } from '@/components/CompanyBadge';
import { ApplicationStatusBadge } from '@/components/ApplicationStatusBadge';
import { publicJobsApi, jobSeekerApi, resumeApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, DollarSign, Clock, Briefcase, Star,
  Building2, Globe, Mail, Phone, CheckCircle2, Send, XCircle,
  CalendarDays, Loader2, FileText,
} from 'lucide-react';

const tradeLabels: Record<string, string> = {
  electrician: 'Electrician', hvac: 'HVAC', welding: 'Welding',
  plumbing: 'Plumbing', carpentry: 'Carpentry', general: 'General',
};
const typeLabels: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time',
  contract: 'Contract', apprenticeship: 'Apprenticeship',
};

const statusMessages: Record<string, { title: string; description: string; icon: 'check' | 'clock' | 'star' | 'celebrate' }> = {
  submitted: {
    title: 'Application Submitted',
    description: 'Your application is with the employer. They\'ll review it and reach out if you\'re a match. Hang tight!',
    icon: 'check',
  },
  reviewed: {
    title: 'Application Reviewed',
    description: 'The employer has reviewed your application. Stay tuned — they may reach out for next steps.',
    icon: 'clock',
  },
  shortlisted: {
    title: 'You\'re Shortlisted!',
    description: 'Great news — you\'ve been shortlisted! The employer is interested. Expect to hear from them soon.',
    icon: 'star',
  },
  interview: {
    title: 'Interview Stage',
    description: 'You\'re moving to the interview stage! Check your email for scheduling details from the employer.',
    icon: 'star',
  },
  offered: {
    title: 'Offer Extended!',
    description: 'Congratulations! The employer has extended an offer. Check your email for details.',
    icon: 'celebrate',
  },
  hired: {
    title: 'You\'re Hired! 🎉',
    description: 'Congratulations on landing the position! The employer will be in touch with onboarding details.',
    icon: 'celebrate',
  },
  rejected: {
    title: 'Not Selected',
    description: 'Unfortunately, the employer has moved forward with other candidates. Don\'t give up — keep applying!',
    icon: 'clock',
  },
  withdrawn: {
    title: 'Application Withdrawn',
    description: 'You withdrew this application. You can browse other open positions.',
    icon: 'clock',
  },
};

function formatSalary(min?: number | null, max?: number | null, period?: string | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  const p = period ? `/${period.replace('ly', '')}` : '';
  if (min && max) return `${fmt(min)} – ${fmt(max)}${p}`;
  if (min) return `From ${fmt(min)}${p}`;
  return `Up to ${fmt(max!)}${p}`;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [activeResume, setActiveResume] = useState<any>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await publicJobsApi.getJob(id);
        setJob(data.job ?? data);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Check application status on load (only for authenticated users)
  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      try {
        const data = await jobSeekerApi.getApplicationStatus(id);
        if (data.applied && data.application) {
          setExistingApplication(data.application);
        }
      } catch { /* ignore - user may not be authenticated */ }
    })();
  }, [id, user]);

  // Load user's active resume when apply dialog opens
  useEffect(() => {
    if (!applyOpen || !user) return;
    setActiveResume(null); // Reset so button stays disabled while fetching
    (async () => {
      setLoadingResume(true);
      try {
        const data = await resumeApi.getDetails();
        setActiveResume(data.resume || null);
      } catch {
        setActiveResume(null);
      }
      setLoadingResume(false);
    })();
  }, [applyOpen, user]);

  const handleApply = async () => {
    if (!id) return;
    if (!activeResume) {
      toast.error('Please upload a resume before applying.');
      return;
    }
    setApplying(true);
    try {
      const result = await jobSeekerApi.applyToJob(id, { resume_id: activeResume.id, cover_letter: coverLetter || undefined });
      toast.success('Application submitted! The employer will review it soon.');
      setExistingApplication({
        id: result.application?.id,
        status: 'submitted',
        created_at: new Date().toISOString(),
        job_title: job?.title,
        company_name: job?.company_name,
        cover_letter: coverLetter || null,
      });
      setApplyOpen(false);
      setCoverLetter('');
      setActiveResume(null);
    } catch (err: any) {
      if (err?.status === 409) {
        try {
          const data = await jobSeekerApi.getApplicationStatus(id);
          if (data.applied) setExistingApplication(data.application);
        } catch {}
        toast.info('You\'ve already applied to this job.');
      } else {
        toast.error(err?.message || 'Failed to apply');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async () => {
    if (!existingApplication?.id) return;
    setWithdrawing(true);
    try {
      await jobSeekerApi.withdrawApplication(existingApplication.id);
      toast.success('Application withdrawn.');
      setExistingApplication({ ...existingApplication, status: 'withdrawn' });
      setWithdrawOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!job) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold">Job not found</h1>
          <Link to="/career-fair" className="text-primary mt-4 inline-block">Back to jobs</Link>
        </div>
      </PageLayout>
    );
  }

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_period);
  const requirements = typeof job.requirements === 'string' ? JSON.parse(job.requirements || '[]') : (job.requirements || []);
  const benefits = typeof job.benefits === 'string' ? JSON.parse(job.benefits || '[]') : (job.benefits || []);

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/career-fair" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to jobs
        </Link>

        <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-2xl md:text-3xl font-heading font-bold">{job.title}</h1>
                {!!job.is_featured && (
                  <Badge variant="outline" className="border-amber-400 text-amber-700 gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400" /> Featured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{job.company_name}</span>
                <CompanyBadge isVerified={job.is_verified} isPartner={job.is_partner} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{tradeLabels[job.trade_category] || job.trade_category}</Badge>
              <Badge variant="outline">{typeLabels[job.employment_type] || job.employment_type}</Badge>
              {!!job.is_remote && <Badge variant="outline">Remote</Badge>}
              {job.experience_level && <Badge variant="outline">{job.experience_level}</Badge>}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.city}, {job.state}</span>
              {salary && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{salary}</span>}
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Posted {new Date(job.created_at).toLocaleDateString()}</span>
              {job.application_deadline && (
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
              )}
            </div>

            <Card>
              <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{job.description}</div>
              </CardContent>
            </Card>

            {requirements.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirements.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {benefits.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Benefits</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {benefits.map((b: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                {existingApplication ? (
                  <ApplicationStatusCard
                    application={existingApplication}
                    onWithdraw={() => setWithdrawOpen(true)}
                  />
                ) : user ? (
                  <Button className="w-full" size="lg" onClick={() => setApplyOpen(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Apply Now
                  </Button>
                ) : (
                  <Button asChild className="w-full" size="lg">
                    <Link to="/auth">Sign in to Apply</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Company card */}
            <Card>
              <CardHeader><CardTitle className="text-sm">About the Company</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {job.company_logo_url ? (
                    <img src={job.company_logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {(job.company_name || 'C')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{job.company_name}</p>
                    <CompanyBadge isVerified={job.is_verified} isPartner={job.is_partner} />
                  </div>
                </div>
                {job.company_industry && (
                  <p className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{job.company_industry}</p>
                )}
                {job.company_website && (
                  <p className="flex items-center gap-1.5 text-muted-foreground"><Globe className="h-3.5 w-3.5" /><a href={job.company_website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{job.company_website.replace(/^https?:\/\//, '')}</a></p>
                )}
                {job.company_email && (
                  <p className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{job.company_email}</p>
                )}
                {job.company_phone && (
                  <p className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{job.company_phone}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {job.title}</DialogTitle>
            <DialogDescription>
              at {job.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Resume <span className="text-destructive">*</span>
              </label>
              {loadingResume ? (
                <div className="h-10 rounded-md border bg-muted animate-pulse" />
              ) : activeResume ? (
                <div className="flex items-center gap-3 p-3 rounded-md border border-green-200 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{activeResume.file_name}</p>
                    {activeResume.trade_program && <p className="text-xs text-muted-foreground">{activeResume.trade_program}</p>}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-sm text-amber-800">
                  You need to upload a resume before applying.{' '}
                  <button type="button" onClick={() => { setApplyOpen(false); navigate('/resume-review'); }} className="underline font-medium">
                    Upload now
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cover Letter (optional)</label>
              <Textarea
                placeholder="Tell the employer why you're a great fit..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                A short introduction can help you stand out. Keep it focused on your relevant skills.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={applying || !activeResume || loadingResume}>
              {applying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="mr-2 h-4 w-4" />Submit Application</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Application?</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application for <strong>{job.title}</strong> at <strong>{job.company_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Keep Application</Button>
            <Button variant="destructive" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Withdrawing...</> : <><XCircle className="mr-2 h-4 w-4" />Withdraw</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

/* ==================== Application Status Card ==================== */

function ApplicationStatusCard({ application, onWithdraw }: { application: any; onWithdraw: () => void }) {
  const status = application.status || 'submitted';
  const msg = statusMessages[status] || statusMessages.submitted;
  const appliedDate = application.created_at ? new Date(application.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
  const canWithdraw = status === 'submitted';

  // Pipeline steps
  const steps = [
    { key: 'submitted', label: 'Applied' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interview', label: 'Interview' },
    { key: 'offered', label: 'Offered' },
    { key: 'hired', label: 'Hired' },
  ];
  const stepOrder = steps.map(s => s.key);
  const currentIdx = stepOrder.indexOf(status);
  const isTerminal = status === 'rejected' || status === 'withdrawn';

  return (
    <div className="space-y-4">
      {/* Status icon and message */}
      <div className="text-center space-y-2">
        {msg.icon === 'celebrate' ? (
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
        ) : msg.icon === 'star' ? (
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center mx-auto">
            <Star className="h-7 w-7 text-blue-600 fill-blue-600" />
          </div>
        ) : msg.icon === 'check' ? (
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Clock className="h-7 w-7 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-semibold text-sm">{msg.title}</p>
          <ApplicationStatusBadge status={status} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">{msg.description}</p>

      {/* Applied date */}
      {appliedDate && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Applied on {appliedDate}
        </div>
      )}

      {/* Progress pipeline (only for non-terminal statuses) */}
      {!isTerminal && currentIdx >= 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-0.5">
            {steps.map((step, i) => {
              const isCompleted = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1.5 w-full rounded-full transition-colors ${
                    isCompleted ? 'bg-green-500' : 'bg-muted'
                  }`} />
                  <span className={`text-[9px] leading-tight text-center ${
                    isCurrent ? 'font-semibold text-foreground' : isCompleted ? 'text-green-600' : 'text-muted-foreground/60'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-1 space-y-2">
        <Button asChild variant="outline" className="w-full" size="sm">
          <Link to="/settings">View All Applications</Link>
        </Button>
        {canWithdraw && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-destructive" onClick={onWithdraw}>
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Withdraw Application
          </Button>
        )}
      </div>
    </div>
  );
}
