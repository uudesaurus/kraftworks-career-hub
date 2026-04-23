import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { publicJobsApi, jobSeekerApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { JobCard } from '@/components/JobCard';
import { JobFilters } from '@/components/JobFilters';

const EMPLOYER_URL = import.meta.env.VITE_EMPLOYER_URL || 'https://hiring.kraftworks.app';
const PAGE_SIZE = 12;

const CareerFair = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [state, setState] = useState('');

  // Fetch user's applications once
  useEffect(() => {
    if (!user) return;
    jobSeekerApi.listMyApplications().then(data => {
      const ids = new Set<string>((data.applications || []).map((a: any) => a.job_id));
      setAppliedJobIds(ids);
    }).catch(() => {});
  }, [user]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await publicJobsApi.listJobs({
        search: search || undefined,
        trade_category: (tradeCategory && tradeCategory !== 'all') ? tradeCategory : undefined,
        employment_type: (employmentType && employmentType !== 'all') ? employmentType : undefined,
        state: (state && state !== 'all') ? state : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setJobs(res.jobs ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, tradeCategory, employmentType, state, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, tradeCategory, employmentType, state]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const clearFilters = () => {
    setSearch('');
    setTradeCategory('');
    setEmploymentType('');
    setState('');
  };

  return (
    <PageLayout>
      {/* Hero */}
      <section className="w-full py-10 md:py-24 px-4 sm:px-6" style={{ backgroundColor: '#eff5ff' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight mb-4">
            Trade Jobs &amp; Career Fair
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Browse open positions from verified employers across electrician, HVAC, welding and more trade careers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button asChild size="lg" className="text-white font-semibold" style={{ backgroundColor: '#FF1B26' }}>
              <a href="#jobs">
                Find Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" className="text-white font-semibold" style={{ backgroundColor: '#1A255D' }}>
              <a href={`${EMPLOYER_URL}`}>
                Post a Job
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Job Board */}
      <section id="jobs" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-heading font-bold mb-6">Open Positions</h2>

        <JobFilters
          search={search}
          tradeCategory={tradeCategory}
          employmentType={employmentType}
          state={state}
          onSearchChange={setSearch}
          onTradeCategoryChange={setTradeCategory}
          onEmploymentTypeChange={setEmploymentType}
          onStateChange={setState}
          onClear={clearFilters}
        />

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </CardContent></Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="py-16 text-center">
              <CardContent className="space-y-3">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No jobs found matching your criteria.</p>
                {(search || tradeCategory || employmentType || state) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">{total} job{total !== 1 ? 's' : ''} found</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job: any) => <JobCard key={job.id} job={job} applied={appliedJobIds.has(job.id)} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Employer CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Card className="text-center py-12" style={{ backgroundColor: '#1A255D' }}>
          <CardContent className="space-y-4">
            <h2 className="text-2xl font-heading font-bold text-white">Hiring Trade Professionals?</h2>
            <p className="text-blue-200 max-w-md mx-auto">
              Register your company and post jobs to reach thousands of qualified electricians, HVAC techs, and welders.
            </p>
            <Button asChild size="lg" className="text-white font-semibold" style={{ backgroundColor: '#FF1B26' }}>
              <a href={`${EMPLOYER_URL}`}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
};

export default CareerFair;
