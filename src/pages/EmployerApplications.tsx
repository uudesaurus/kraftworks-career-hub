import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmployerLayout } from '@/components/EmployerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ApplicationStatusBadge } from '@/components/ApplicationStatusBadge';
import { employerApi } from '@/lib/api';
import { toast } from 'sonner';
import { Mail, FileText, ChevronDown, RefreshCw, Users, TrendingUp } from 'lucide-react';

const APPLICATION_STATUSES = [
  { value: 'submitted', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'offered', label: 'Offered' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

function getNextAction(status: string): { label: string; status: string } | null {
  switch (status) {
    case 'submitted': return { label: 'Mark Reviewed', status: 'reviewed' };
    case 'reviewed': return { label: 'Shortlist', status: 'shortlisted' };
    case 'shortlisted': return { label: 'Schedule Interview', status: 'interview' };
    case 'interview': return { label: 'Extend Offer', status: 'offered' };
    case 'offered': return { label: 'Mark Hired', status: 'hired' };
    default: return null;
  }
}

export default function EmployerApplications() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [editApp, setEditApp] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employerApi.listMyJobs();
      const jobList = data.jobs ?? data ?? [];
      setJobs(jobList);

      if (jobList.length > 0) {
        const allApps: any[] = [];
        for (const job of jobList) {
          try {
            const appData = await employerApi.listApplications(job.id);
            const apps = (appData.applications ?? appData ?? []).map((a: any) => ({
              ...a,
              job_title: job.title,
              job_trade: job.trade_category,
            }));
            allApps.push(...apps);
          } catch { /* skip individual job errors */ }
        }
        allApps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAllApplications(allApps);
        setApplications(allApps);
      }
    } catch {
      setError('Failed to load applications.');
      toast.error('Failed to load applications');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let filtered = selectedJob === 'all'
      ? allApplications
      : allApplications.filter(a => a.job_id === selectedJob);

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    setApplications(filtered);
  }, [selectedJob, statusFilter, allApplications]);

  const statusCounts = useMemo(() => {
    const source = selectedJob === 'all'
      ? allApplications
      : allApplications.filter(a => a.job_id === selectedJob);
    const counts: Record<string, number> = {};
    source.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  }, [allApplications, selectedJob]);

  const totalForJob = selectedJob === 'all'
    ? allApplications.length
    : allApplications.filter(a => a.job_id === selectedJob).length;

  const openEdit = (app: any) => {
    setEditApp(app);
    setNewStatus(app.status);
    setNotes(app.employer_notes || '');
  };

  const handleUpdate = async () => {
    if (!editApp) return;
    setUpdating(true);
    try {
      await employerApi.updateApplicationStatus(editApp.id, {
        status: newStatus,
        employer_notes: notes || undefined,
      });
      setAllApplications(prev => prev.map(a => a.id === editApp.id ? { ...a, status: newStatus, employer_notes: notes } : a));
      toast.success('Application updated');
      setEditApp(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </EmployerLayout>
    );
  }

  if (error) {
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

  return (
    <EmployerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {allApplications.length} total across {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Pipeline Summary */}
        {allApplications.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {APPLICATION_STATUSES.map(s => {
              const count = allApplications.filter(a => a.status === s.value).length;
              const isActive = statusFilter === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(isActive ? 'all' : s.value)}
                  className={`rounded-lg border p-2 text-center transition-colors cursor-pointer ${
                    isActive ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent/50'
                  }`}
                >
                  <p className={`text-lg font-bold ${count > 0 ? '' : 'text-muted-foreground/40'}`}>{count}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </button>
              );
            })}
          </div>
        )}

        {jobs.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent className="space-y-4">
              <h2 className="text-lg font-semibold">No jobs posted yet</h2>
              <p className="text-muted-foreground text-sm">Post a job to start receiving applications.</p>
              <Button asChild>
                <Link to="/employer/jobs/new">Post Your First Job</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="w-full sm:max-w-xs">
                  <SelectValue placeholder="All jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs ({allApplications.length})</SelectItem>
                  {jobs.map(j => {
                    const count = allApplications.filter(a => a.job_id === j.id).length;
                    return (
                      <SelectItem key={j.id} value={j.id}>
                        {j.title} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:max-w-[200px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses ({totalForJob})</SelectItem>
                  {APPLICATION_STATUSES.map(s => {
                    const count = statusCounts[s.value] || 0;
                    return (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Applications list */}
            {applications.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    {statusFilter !== 'all'
                      ? `No ${APPLICATION_STATUSES.find(s => s.value === statusFilter)?.label?.toLowerCase() || statusFilter} applications.`
                      : 'No applications for this selection yet.'}
                  </p>
                  {statusFilter !== 'all' && (
                    <Button variant="link" size="sm" onClick={() => setStatusFilter('all')} className="mt-2">
                      Clear filter
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {applications.map(app => {
                  const nextAction = getNextAction(app.status);
                  return (
                  <Card key={app.id} className={app.status === 'submitted' ? 'border-l-2 border-l-blue-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                          {(app.applicant_name || app.applicant_email || app.user_email || '?').charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-sm">
                                {app.applicant_name || app.applicant_email || app.user_email || 'Unknown Applicant'}
                              </h3>
                              {app.applicant_name && (app.applicant_email || app.user_email) && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Mail className="h-3 w-3" />
                                  {app.applicant_email || app.user_email}
                                </p>
                              )}
                            </div>
                            <ApplicationStatusBadge status={app.status} />
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{app.job_title || 'Unknown Job'}</span>
                            {app.job_trade && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{app.job_trade}</Badge>
                            )}
                            <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                            {app.resume_file_name && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Resume
                              </span>
                            )}
                          </div>

                          {app.cover_letter && (
                            <div className="mt-2">
                              <button
                                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <ChevronDown className={`h-3 w-3 transition-transform ${expandedApp === app.id ? 'rotate-180' : ''}`} />
                                Cover Letter
                              </button>
                              {expandedApp === app.id && (
                                <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground whitespace-pre-wrap">
                                  {app.cover_letter}
                                </div>
                              )}
                            </div>
                          )}

                          {app.employer_notes && (
                            <div className="mt-2 p-2 rounded bg-muted/50 border border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">Internal Notes</p>
                              <p className="text-xs text-muted-foreground">{app.employer_notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 sm:self-center space-y-1.5">
                          {nextAction && (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setEditApp(app);
                                setNewStatus(nextAction.status);
                                setNotes(app.employer_notes || '');
                              }}
                            >
                              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                              {nextAction.label}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(app)}>
                            Update Status
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={!!editApp} onOpenChange={() => setEditApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application</DialogTitle>
            <DialogDescription>
              {editApp && (
                <span>{editApp.applicant_name || editApp.applicant_email || editApp.user_email} — {editApp.job_title}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Internal Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add notes about this applicant (only visible to your team)..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditApp(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updating}>{updating ? 'Saving...' : 'Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EmployerLayout>
  );
}
