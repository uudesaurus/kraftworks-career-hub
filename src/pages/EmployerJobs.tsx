import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmployerLayout } from '@/components/EmployerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { employerApi } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, Search, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || 'https://career.kraftworks.app';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  draft: 'secondary',
  paused: 'outline',
  closed: 'destructive',
  expired: 'outline',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

export default function EmployerJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employerApi.listMyJobs();
      setJobs(data.jobs ?? data ?? []);
    } catch {
      setError('Failed to load job listings.');
      toast.error('Failed to load jobs');
      setJobs([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !search || job.title?.toLowerCase().includes(search.toLowerCase()) || job.trade_category?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobs.length };
    jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
    return counts;
  }, [jobs]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await employerApi.deleteJob(deleteId);
      toast.success('Job deleted');
      setJobs(prev => prev.filter(j => j.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
    setDeleting(false);
  };

  const formatSalary = (job: any) => {
    if (!job.salary_min && !job.salary_max) return null;
    const min = job.salary_min ? `$${Number(job.salary_min).toLocaleString()}` : '';
    const max = job.salary_max ? `$${Number(job.salary_max).toLocaleString()}` : '';
    const range = min && max ? `${min}–${max}` : min || max;
    return `${range}${job.salary_period ? `/${job.salary_period}` : ''}`;
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
          <Button onClick={fetchJobs} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Job Listings</h1>
            <p className="text-sm text-muted-foreground mt-1">{jobs.length} total listings</p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/employer/jobs/new"><Plus className="h-4 w-4" />Post New Job</Link>
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="py-20 text-center">
            <CardContent className="space-y-4">
              <h2 className="text-lg font-semibold">No jobs posted yet</h2>
              <p className="text-muted-foreground text-sm">Create your first listing to start receiving applications from trade professionals.</p>
              <Button asChild size="lg">
                <Link to="/employer/jobs/new">Create Your First Job</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {STATUS_FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={statusFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(f.value)}
                    className="gap-1.5"
                  >
                    {f.label}
                    {statusCounts[f.value] !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0 rounded-full ${statusFilter === f.value ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                        {statusCounts[f.value] || 0}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Jobs as cards on mobile, table on desktop */}
            <div className="hidden md:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Applications</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{job.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="capitalize">{job.trade_category}</span>
                              <span>·</span>
                              <span>{job.employment_type?.replace('_', ' ')}</span>
                              {job.city && <><span>·</span><span>{job.city}, {job.state}</span></>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[job.status] || 'outline'}>{job.status}</Badge>
                          {job.application_deadline && new Date(job.application_deadline) < new Date() && job.status === 'active' && (
                            <p className="text-[10px] text-destructive mt-1">Expired deadline</p>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">{job.application_count ?? 0}</TableCell>
                        <TableCell className="text-center">{job.views_count ?? 0}</TableCell>
                        <TableCell>
                          {formatSalary(job) ? (
                            <span className="text-sm">{formatSalary(job)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(job.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" title="Preview">
                              <a href={`${MAIN_APP_URL}/career-fair/jobs/${job.id}`} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /></a>
                            </Button>
                            <Button asChild variant="ghost" size="icon" title="Edit">
                              <Link to={`/employer/jobs/${job.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteId(job.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredJobs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No jobs match your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredJobs.map(job => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{job.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground capitalize">{job.trade_category}</span>
                          <Badge variant={STATUS_VARIANTS[job.status] || 'outline'} className="text-[10px]">{job.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{job.application_count ?? 0} apps</span>
                      <span>{job.views_count ?? 0} views</span>
                      {formatSalary(job) && <span>{formatSalary(job)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        {job.city && `${job.city}, ${job.state} · `}
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link to={`/employer/jobs/${job.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(job.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredJobs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No jobs match your filters.</p>
              )}
            </div>
          </>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Job Listing?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. All applications for this job will also be removed.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EmployerLayout>
  );
}
