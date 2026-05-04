import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EmployerLayout } from '@/components/EmployerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ApplicationStatusBadge } from '@/components/ApplicationStatusBadge';
import { employerApi } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, ArrowRight, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'submitted', label: 'New' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview', label: 'Interview' },
  { key: 'offered', label: 'Offered' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
];

export default function EmployerDashboard() {
  const [data, setData] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, compData] = await Promise.all([
        employerApi.getDashboard().catch(() => null),
        employerApi.getCompany().catch(() => null),
      ]);
      setData(dashData);
      setCompany(dashData?.company ?? compData?.company ?? compData);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <EmployerLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-48" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </EmployerLayout>
    );
  }

  if (error && !company) {
    return (
      <EmployerLayout>
        <div className="max-w-md mx-auto text-center py-20 space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </EmployerLayout>
    );
  }

  if (!company) {
    return (
      <EmployerLayout>
        <div className="max-w-lg mx-auto text-center py-20 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Welcome to Kraftworks</h1>
          <p className="text-muted-foreground text-lg">
            Register your company to start posting jobs and connecting with skilled trade professionals.
          </p>
          <Button asChild size="lg">
            <Link to="/employer/register">Register Your Company</Link>
          </Button>
        </div>
      </EmployerLayout>
    );
  }

  const stats = data?.stats || {};
  const pipeline = data?.pipeline || {};
  const jobsByTrade = data?.jobs_by_trade || {};
  const topJobs = data?.top_jobs || [];
  const attentionJobs = data?.attention_jobs || [];
  const recentApps = data?.recent_applications || [];
  const totalPipeline = Object.values(pipeline).reduce((a: number, b: any) => a + (b || 0), 0) as number;

  const profileFields = ['company_name', 'company_email', 'description', 'industry', 'company_size', 'company_phone', 'company_website', 'city', 'state'];
  const filledFields = profileFields.filter(f => company[f] && String(company[f]).trim()).length;
  const completeness = Math.round((filledFields / profileFields.length) * 100);

  return (
    <EmployerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">{company.company_name}</span>
              <Badge variant={company.status === 'active' ? 'default' : company.status === 'suspended' ? 'destructive' : 'secondary'}>
                {company.status?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <Button asChild>
            <Link to="/employer/jobs/new"><Plus className="h-4 w-4 mr-1.5" />Post a Job</Link>
          </Button>
        </div>

        {company.status === 'pending_review' && (
          <Card className="border-border bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Company Under Review</p>
              <p className="text-sm text-muted-foreground mt-0.5">Your company profile is being reviewed. You can still create job listings, but they won't be visible to candidates until approved.</p>
            </CardContent>
          </Card>
        )}

        {completeness < 100 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Profile completeness</p>
                <span className="text-sm font-semibold">{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                A complete profile helps attract better candidates.{' '}
                <Link to="/employer/company" className="underline">Edit profile</Link>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stat Cards — uniform, no colored icons */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Active Jobs', value: stats.active_jobs ?? 0, sub: `${stats.total_jobs ?? 0} total` },
            { label: 'Applications', value: stats.total_applications ?? 0, sub: `${stats.pending_applications ?? 0} awaiting review` },
            { label: 'Total Views', value: stats.total_views ?? 0, sub: stats.total_applications && stats.total_views ? `${((stats.total_applications / Math.max(stats.total_views, 1)) * 100).toFixed(1)}% apply rate` : 'Across all listings' },
            { label: 'Hired', value: pipeline.hired ?? 0, sub: pipeline.offered ? `${pipeline.offered} pending offers` : 'Successful hires' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hiring Pipeline — simple text-based, no rainbow bar */}
        {totalPipeline > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Hiring Pipeline</CardTitle>
                  <CardDescription>{totalPipeline} total applications</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link to="/employer/applications">View all <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Simple progress bar per stage */}
              <div className="space-y-3">
                {PIPELINE_STAGES.filter(s => pipeline[s.key]).map(stage => {
                  const count = pipeline[stage.key] || 0;
                  const pct = (count / totalPipeline) * 100;
                  return (
                    <div key={stage.key} className="flex items-center gap-3">
                      <span className="text-sm w-24 text-muted-foreground">{stage.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Performing Jobs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Top Jobs</CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link to="/employer/jobs">All jobs <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topJobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No jobs posted yet.</p>
                  <Button asChild variant="link" size="sm" className="mt-1">
                    <Link to="/employer/jobs/new">Create your first listing</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {topJobs.map((job: any) => (
                    <Link key={job.id} to={`/employer/jobs/${job.id}/edit`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.trade_category} · {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{job.application_count}</p>
                        <p className="text-[10px] text-muted-foreground">applicants</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Applications</CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link to="/employer/applications">View all <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentApps.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No applications received yet.</p>
              ) : (
                <div className="space-y-1">
                  {recentApps.slice(0, 6).map((app: any) => (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                        {(app.applicant_name || app.applicant_email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{app.applicant_name || app.applicant_email}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.job_title}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <ApplicationStatusBadge status={app.status} />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attention items */}
        {attentionJobs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Needs Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {attentionJobs.map((job: any) => {
                  const isExpired = job.application_deadline && new Date(job.application_deadline) < new Date();
                  const noApps = job.application_count === 0;
                  return (
                    <Link key={job.id} to={`/employer/jobs/${job.id}/edit`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {noApps && 'No applicants yet'}
                          {noApps && isExpired && ' · '}
                          {isExpired && 'Deadline passed'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jobs by trade — simple list, no colored badges */}
        {Object.keys(jobsByTrade).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Jobs by Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(jobsByTrade)
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .map(([trade, count]: any) => (
                    <div key={trade} className="flex items-center gap-3">
                      <span className="text-sm w-28 capitalize text-muted-foreground">{trade}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/50"
                          style={{ width: `${(count / Math.max(stats.total_jobs, 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployerLayout>
  );
}
