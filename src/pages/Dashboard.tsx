import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useResume } from '@/hooks/useResume';
import { useAIUsage } from '@/hooks/useAIUsage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Upload, CheckCircle, Clock, MessageSquare, ArrowRight, Sparkles, AlertTriangle, Briefcase, User, MapPin, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useResumeFeedback } from '@/hooks/useResumeFeedback';
import { questionsApi, publicJobsApi } from '@/lib/api';
import { useState, useEffect } from 'react';

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { resume, loading: resumeLoading } = useResume();
  const { remaining, maxActions, loading: usageLoading } = useAIUsage();
  const { feedback, loading: feedbackLoading } = useResumeFeedback();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const usedActions = maxActions - remaining;

  // Fetch latest interview questions result
  const [latestInterview, setLatestInterview] = useState<{ total: number; date: string } | null>(null);
  useEffect(() => {
    if (!user) return;
    questionsApi.list().then((data) => {
      const items = data.questions || [];
      if (items.length > 0) {
        const latest = items[0];
        const t = Array.isArray(latest.technical) ? latest.technical.length : 0;
        const b = Array.isArray(latest.behavioral) ? latest.behavioral.length : 0;
        const s = Array.isArray(latest.situational) ? latest.situational.length : 0;
        setLatestInterview({ total: t + b + s, date: latest.created_at });
      }
    }).catch(() => {});
  }, [user]);

  // Fetch suggested jobs based on trade program
  const [suggestedJobs, setSuggestedJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Map resume trade_program to job trade_category
        const tradeMap: Record<string, string> = {
          'electrician': 'electrician', 'electrical': 'electrician', 'electrical technology': 'electrician',
          'hvac': 'hvac', 'hvac & refrigeration': 'hvac', 'hvac and refrigeration': 'hvac',
          'welding': 'welding', 'welding technology': 'welding',
          'plumbing': 'plumbing', 'carpentry': 'carpentry',
        };
        const tradeCategory = resume?.trade_program
          ? tradeMap[resume.trade_program.toLowerCase()] || undefined
          : undefined;

        const data = await publicJobsApi.listJobs({
          trade_category: tradeCategory,
          limit: 3,
        });
        setSuggestedJobs(data.jobs || []);
      } catch {}
      setJobsLoading(false);
    };
    fetchJobs();
  }, [resume]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div {...fadeIn}>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your career progress.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Resume Upload Card */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-heading">Resume</CardTitle>
                </div>
                <CardDescription>Upload and manage your resume</CardDescription>
              </CardHeader>
              <CardContent>
                {resumeLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ) : resume ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{resume.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(resume.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">Uploaded</Badge>
                    </div>
                    {feedback?.status === 'approved' && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-accent text-xs">
                        <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-medium">Feedback Ready</span>
                      </div>
                    )}
                    {feedback?.status === 'pending_review' && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-accent text-xs">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-medium">Feedback Pending Review</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/resume-review')}
                    >
                      Manage Resume
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No resume uploaded yet
                    </p>
                    <Button size="sm" onClick={() => navigate('/resume-review')}>
                      Upload Resume
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Usage Card */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-heading">AI Usage</CardTitle>
                </div>
                <CardDescription>Beta AI action limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usageLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground font-medium">
                          {remaining} of {maxActions} remaining
                        </span>
                        <Badge variant={remaining === 0 ? 'destructive' : remaining === 1 ? 'outline' : 'secondary'}>
                          {remaining === 0 ? 'Limit reached' : remaining === 1 ? '1 left' : 'Beta'}
                        </Badge>
                      </div>
                      <Progress value={(usedActions / maxActions) * 100} className="h-2" />
                    </div>
                    {remaining === 0 ? (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        <span className="text-destructive">All AI actions used. Changing your resume input unlocks re-runs.</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Each resume feedback or question generation uses 1 AI action.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Interview Questions Card */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-heading">Interview Prep</CardTitle>
                </div>
                <CardDescription>Practice questions & results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestInterview ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm">{latestInterview.total} questions</span>
                      <Badge variant="secondary">
                        {new Date(latestInterview.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/interview-prep')}
                    >
                      View Questions
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm">Latest Result</span>
                      <Badge variant="secondary">No attempts</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Generate tailored interview questions from your resume and a job description.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/interview-prep')}
                    >
                      Start Practicing
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Your Profile + Suggested Jobs row */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Your Profile */}
          <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-heading">Your Profile</CardTitle>
                </div>
                <CardDescription>A snapshot of who you are to employers</CardDescription>
              </CardHeader>
              <CardContent>
                {resumeLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ) : resume ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate">{resume.file_name}</span>
                      </div>
                      {resume.trade_program && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground capitalize">{resume.trade_program}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Uploaded {new Date(resume.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {feedback?.status === 'approved' && feedback.overall_score != null && (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <span className="text-sm text-foreground">Resume Score</span>
                        <Badge variant={feedback.overall_score >= 7 ? 'default' : feedback.overall_score >= 5 ? 'secondary' : 'outline'}>
                          {feedback.overall_score}/10
                        </Badge>
                      </div>
                    )}
                    {!resume.trade_program && (
                      <p className="text-xs text-muted-foreground">
                        Tip: Re-upload with a trade program selected to get better job matches.
                      </p>
                    )}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/resume-review')}>
                      Update Resume <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">No resume uploaded</p>
                    <p className="text-xs text-muted-foreground mb-3">Upload your resume to build your profile and get matched with jobs.</p>
                    <Button size="sm" onClick={() => navigate('/resume-review')}>Upload Resume</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Suggested Jobs */}
          <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-heading">Jobs For You</CardTitle>
                </div>
                <CardDescription>
                  {resume?.trade_program
                    ? `Listings matching your ${resume.trade_program} background`
                    : 'Latest trade job openings'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : suggestedJobs.length > 0 ? (
                  <div className="space-y-3">
                    {suggestedJobs.map((job: any) => (
                      <button
                        key={job.id}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        onClick={() => navigate(`/career-fair?job=${job.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.company_name}</p>
                          </div>
                          {job.is_featured === 1 && (
                            <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0">Featured</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          {(job.city || job.state) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {[job.city, job.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                          {job.salary_min != null && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {job.salary_min}{job.salary_max ? `–${job.salary_max}` : ''}{job.salary_period ? `/${job.salary_period}` : ''}
                            </span>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                            {job.employment_type?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </button>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/career-fair')}>
                      Browse All Jobs <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No matching jobs right now</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/career-fair')}>
                      Browse All Jobs <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => navigate('/resume-review')}
                >
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Review Resume</p>
                    <p className="text-xs text-muted-foreground">Get expert feedback</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => navigate('/interview-prep')}
                >
                  <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Interview Prep</p>
                    <p className="text-xs text-muted-foreground">Practice questions</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => navigate('/career-toolkit')}
                >
                  <Briefcase className="mr-2 h-4 w-4 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Career Toolkit</p>
                    <p className="text-xs text-muted-foreground">Resources & guides</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => navigate('/career-fair')}
                >
                  <Briefcase className="mr-2 h-4 w-4 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Career Fair</p>
                    <p className="text-xs text-muted-foreground">Browse trade jobs</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
