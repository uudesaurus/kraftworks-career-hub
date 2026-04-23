import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAIUsage } from '@/hooks/useAIUsage';
import { useResumeFeedback, type ResumeFeedback } from '@/hooks/useResumeFeedback';
import { questionsApi, jobSeekerApi } from '@/lib/api';
import { ApplicationStatusBadge } from '@/components/ApplicationStatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon, Zap, FileText, MessageSquare, Briefcase,
  Clock, CheckCircle, XCircle, AlertCircle, History,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface InterviewResult {
  id: string;
  job_description: string;
  technical: string[];
  behavioral: string[];
  situational: string[];
  created_at: string;
}

interface JobApplication {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  job_title?: string;
  company_name?: string;
  job?: { title?: string; company_name?: string };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function statusIcon(status: string) {
  switch (status) {
    case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4 text-yellow-500" />;
  }
}

const Settings = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { used, maxActions, remaining } = useAIUsage();
  const { allFeedback, loading: feedbackLoading } = useResumeFeedback();
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<InterviewResult[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    questionsApi.list().then((data) => {
      setInterviews(data.questions || []);
    }).catch(() => {}).finally(() => setInterviewsLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    jobSeekerApi.listMyApplications().then((data) => {
      setApplications(data.applications || []);
    }).catch(() => {}).finally(() => setApplicationsLoading(false));
  }, [user]);

  const totalFeedback = allFeedback.length;
  const totalInterviews = interviews.length;
  const totalApplications = applications.length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account, view your history, and track usage.</p>
          </div>
        </div>

        {/* Account Overview with Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                  {isAdmin ? 'Admin' : 'User'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" /> AI Credits
                </p>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{remaining} remaining <span className="text-muted-foreground">({used}/{maxActions} used)</span></p>
                  <Progress value={(used / maxActions) * 100} className="h-2" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{totalFeedback}</p>
                  <p className="text-[11px] text-muted-foreground">Resume Reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{totalInterviews}</p>
                  <p className="text-[11px] text-muted-foreground">Interview Preps</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{totalApplications}</p>
                  <p className="text-[11px] text-muted-foreground">Applications</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity History Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Activity History
            </CardTitle>
            <CardDescription>View all your past AI-generated feedback, interview preps, and job applications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="feedback" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="feedback" className="text-xs sm:text-sm">
                  <FileText className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
                  Resume Reviews
                </TabsTrigger>
                <TabsTrigger value="interviews" className="text-xs sm:text-sm">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
                  Interview Prep
                </TabsTrigger>
                <TabsTrigger value="applications" className="text-xs sm:text-sm">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
                  Applications
                </TabsTrigger>
              </TabsList>

              {/* Resume Feedback History */}
              <TabsContent value="feedback">
                {feedbackLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : allFeedback.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-8 w-8 text-muted-foreground/50" />}
                    title="No resume reviews yet"
                    description="Upload your resume and generate AI feedback to see your history here."
                    actionLabel="Go to Resume Review"
                    onAction={() => navigate('/resume-review')}
                  />
                ) : (
                  <div className="space-y-3">
                    {allFeedback.map((fb) => (
                      <FeedbackHistoryItem key={fb.id} feedback={fb} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Interview Prep History */}
              <TabsContent value="interviews">
                {interviewsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : interviews.length === 0 ? (
                  <EmptyState
                    icon={<MessageSquare className="h-8 w-8 text-muted-foreground/50" />}
                    title="No interview preps yet"
                    description="Generate AI-powered interview questions to see your history here."
                    actionLabel="Go to Interview Prep"
                    onAction={() => navigate('/interview-prep')}
                  />
                ) : (
                  <div className="space-y-3">
                    {interviews.map((interview) => (
                      <InterviewHistoryItem key={interview.id} interview={interview} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Job Applications History */}
              <TabsContent value="applications">
                {applicationsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : applications.length === 0 ? (
                  <EmptyState
                    icon={<Briefcase className="h-8 w-8 text-muted-foreground/50" />}
                    title="No applications yet"
                    description="Browse the Career Fair and apply to jobs to see your application history."
                    actionLabel="Browse Jobs"
                    onAction={() => navigate('/career-fair')}
                  />
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <ApplicationHistoryItem key={app.id} application={app} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Credit Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> Credit Usage Breakdown
            </CardTitle>
            <CardDescription>How your {maxActions} AI credits have been used.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <CreditUsageRow
                icon={<FileText className="h-4 w-4 text-blue-500" />}
                label="Resume Reviews"
                count={totalFeedback}
                total={maxActions}
                color="bg-blue-500"
              />
              <CreditUsageRow
                icon={<MessageSquare className="h-4 w-4 text-purple-500" />}
                label="Interview Preps"
                count={totalInterviews}
                total={maxActions}
                color="bg-purple-500"
              />
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Total Used</span>
                <span className="font-bold">{used} / {maxActions}</span>
              </div>
              {remaining === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    You've used all your AI credits. Contact support if you need more.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


      </div>
    </DashboardLayout>
  );
};

// ── Sub-components ──────────────────────────────────────────────

function EmptyState({ icon, title, description, actionLabel, onAction }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
      {icon}
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
      <button
        onClick={onAction}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        {actionLabel} →
      </button>
    </div>
  );
}

function FeedbackHistoryItem({ feedback }: { feedback: ResumeFeedback }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="shrink-0">{statusIcon(feedback.status)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            Resume Feedback
          </p>
          <Badge variant={feedback.status === 'approved' ? 'default' : feedback.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
            {feedback.status === 'pending_review' ? 'Pending Review' : feedback.status === 'approved' ? 'Reviewed' : feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{formatDate(feedback.created_at)}</span>
          <span>{feedback.strengths.length} strengths · {feedback.improvements.length} improvements</span>
        </div>
      </div>
    </div>
  );
}

function InterviewHistoryItem({ interview }: { interview: InterviewResult }) {
  const totalQ = (interview.technical?.length || 0) + (interview.behavioral?.length || 0) + (interview.situational?.length || 0);
  const desc = interview.job_description?.length > 80
    ? interview.job_description.slice(0, 80) + '…'
    : interview.job_description;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="shrink-0">
        <MessageSquare className="h-4 w-4 text-purple-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{desc || 'Interview Questions'}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{formatDate(interview.created_at)}</span>
          <span>{totalQ} questions</span>
          <span className="text-muted-foreground/70">
            {interview.technical?.length || 0} technical · {interview.behavioral?.length || 0} behavioral · {interview.situational?.length || 0} situational
          </span>
        </div>
      </div>
    </div>
  );
}

function ApplicationHistoryItem({ application }: { application: JobApplication }) {
  const title = application.job_title || application.job?.title || 'Job Application';
  const company = application.company_name || application.job?.company_name;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="shrink-0">
        <Briefcase className="h-4 w-4 text-green-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{title}</p>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{formatDate(application.created_at)}</span>
          {company && <span>{company}</span>}
        </div>
      </div>
    </div>
  );
}

function CreditUsageRow({ icon, label, count, total, color }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min((count / total) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default Settings;
