import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { AlertCircle, Sparkles, MessageSquare, Wrench, Users, Target, Trash2, History, Loader2, XCircle, BookOpen, ExternalLink, CheckCircle2, Upload, AlertTriangle } from 'lucide-react';
import { useResume } from '@/hooks/useResume';
import { useAIUsage } from '@/hooks/useAIUsage';
import { useAuth } from '@/hooks/useAuth';
import { questionsApi } from '@/lib/api';
import { AICreditLimitDialog } from '@/components/AICreditLimitDialog';
import { getResourceById, RESOURCE_TYPE_ICONS, RESOURCE_TYPE_LABELS } from '@/data/resources';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface InterviewResult {
  id: string;
  job_description: string;
  technical: string[];
  behavioral: string[];
  situational: string[];
  recommended_resources: Array<{ resource_id: string; reason: string }>;
  created_at: string;
}

const InterviewPrep = () => {
  const { user } = useAuth();
  const { resume } = useResume();
  const { remaining, maxActions } = useAIUsage();
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [latestResult, setLatestResult] = useState<InterviewResult | null>(null);
  const [allResults, setAllResults] = useState<InterviewResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreditLimitDialog, setShowCreditLimitDialog] = useState(false);
  const [tradeNotice, setTradeNotice] = useState<string | null>(null);

  // Fetch latest saved result
  useEffect(() => {
    if (!user) return;
    const fetchQuestions = async () => {
      try {
        const data = await questionsApi.list();
        const items = data.questions || [];
        setAllResults(items);
        if (items.length > 0) {
          setLatestResult(items[0]);
          setResult(items[0]);
        }
      } catch {}
      setLoading(false);
    };
    fetchQuestions();
  }, [user]);

  // Only show credit dialog when the user explicitly tries to generate, not on page load

  const charCount = jobDescription.length;
  const isTooShort = charCount > 0 && charCount < 10;
  const isTooLong = charCount > 2000;
  const canGenerate = !generating;

  const handleGenerate = async (overrideJobDescription?: string) => {
    if (!user) {
      toast.error('Please sign in to generate interview questions.');
      navigate('/auth');
      return;
    }
    if (remaining <= 0) {
      setShowCreditLimitDialog(true);
      return;
    }

    const targetJobDescription = overrideJobDescription ?? jobDescription;
    const trimmedJobDescription = targetJobDescription.trim();

    if (trimmedJobDescription.length < 10) {
      toast.error('Please enter a job description (at least 10 characters).');
      return;
    }
    if (targetJobDescription.length > 2000) {
      toast.error('Job description must be under 2,000 characters.');
      return;
    }
    if (!resume) {
      toast.error('Please upload your resume first.');
      return;
    }

    setGenerating(true);
    try {
      const data = await questionsApi.generate(trimmedJobDescription);
      const q = data.questions ?? data;
      if (!q?.id) throw new Error('Invalid response from server.');
      const parsed: InterviewResult = {
        id: q.id,
        job_description: q.job_description,
        technical: Array.isArray(q.technical) ? q.technical : [],
        behavioral: Array.isArray(q.behavioral) ? q.behavioral : [],
        situational: Array.isArray(q.situational) ? q.situational : [],
        recommended_resources: Array.isArray(q.recommended_resources) ? q.recommended_resources : [],
        created_at: q.created_at,
      };
      setResult(parsed);
      setLatestResult(parsed);
      setAllResults(prev => [parsed, ...prev]);
      setJobDescription(trimmedJobDescription);
      setTradeNotice(data.trade_notice || null);
      toast.success('Interview questions generated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate questions.');
    } finally {
      setGenerating(false);
    }
  };

  const totalQuestions = result
    ? (Array.isArray(result.technical) ? result.technical.length : 0)
      + (Array.isArray(result.behavioral) ? result.behavioral.length : 0)
      + (Array.isArray(result.situational) ? result.situational.length : 0)
    : 0;

  const handleDelete = async (id: string) => {
    // Optimistic: remove from UI immediately
    const prevAll = allResults;
    const prevResult = result;
    const updated = allResults.filter(r => r.id !== id);
    setAllResults(updated);
    if (result?.id === id) {
      setResult(updated[0] || null);
      setLatestResult(updated[0] || null);
    }
    try {
      await questionsApi.delete(id);
      toast.success('Question set deleted.');
    } catch {
      // Rollback on failure
      setAllResults(prevAll);
      if (prevResult?.id === id) {
        setResult(prevResult);
        setLatestResult(prevResult);
      }
      toast.error('Failed to delete.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Interview Prep</h1>
          <p className="text-muted-foreground mt-1">
            Generate tailored interview questions based on your resume and a job description.
          </p>
        </div>

        {/* Beta limits */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-accent border border-border">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-foreground">Beta Limits</p>
            <p className="text-muted-foreground">
              {remaining} of {maxActions} AI actions remaining
            </p>
            <div className="flex items-center gap-1.5">
              {resume ? (
                <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600">Resume uploaded</span></>
              ) : (
                <><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive font-medium">No resume uploaded — required to generate</span></>
              )}
            </div>
          </div>
        </div>

        {/* Generator Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Generate Questions</CardTitle>
            <CardDescription>
              Paste a job description and we'll generate tailored interview questions using your resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Job Description
              </label>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                className="resize-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-1">
                {isTooShort && (
                  <p className="text-xs text-destructive">Minimum 10 characters required</p>
                )}
                {isTooLong && (
                  <p className="text-xs text-destructive">Maximum 2,000 characters exceeded</p>
                )}
                {!isTooShort && !isTooLong && <span />}
                <p className={`text-xs ${isTooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {charCount}/2,000
                </p>
              </div>
            </div>

            {!resume && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Upload className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-destructive">
                    Resume required
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You need to upload a resume before generating interview questions.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => navigate('/resume-review')}
                  >
                    <Upload className="mr-1.5 h-3 w-3" />
                    Upload Resume Now
                  </Button>
                </div>
              </div>
            )}

            {remaining <= 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 text-xs">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-destructive">
                    Maximum of {maxActions} AI actions reached.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreditLimitDialog(true)}
                    className="text-destructive underline underline-offset-2"
                  >
                    Contact admin to request more credits
                  </button>
                </div>
              </div>
            )}

            {!resume ? (
              <Button
                onClick={() => navigate('/resume-review')}
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume to Generate Questions
              </Button>
            ) : remaining <= 0 ? (
              <Button
                onClick={() => setShowCreditLimitDialog(true)}
                variant="outline"
                className="w-full"
                disabled={false}
              >
                <XCircle className="mr-2 h-4 w-4" />
                No AI Credits — Request More
              </Button>
            ) : (
              <Button
                onClick={() => handleGenerate()}
                disabled={generating || jobDescription.trim().length < 10}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {generating ? 'Generating Questions...' : 'Generate Interview Questions'}
              </Button>
            )}
            {!generating && resume && remaining > 0 && jobDescription.trim().length < 10 && (
              <p className="text-xs text-center text-muted-foreground">
                Paste a job description above (at least 10 characters) to get started.
              </p>
            )}
            {generating && (
              <p className="text-xs text-muted-foreground text-center">
                Analyzing your resume against the job description... This usually takes 10-20 seconds.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : result ? (
          <div className="space-y-4">
            {tradeNotice && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-amber-800 dark:text-amber-300">Not a Skilled Trade</p>
                  <p className="text-amber-700 dark:text-amber-400">{tradeNotice}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold text-foreground">
                Generated Questions ({totalQuestions})
              </h2>
              <div className="flex items-center gap-2">
                {latestResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate(latestResult.job_description)}
                    disabled={generating || !resume}
                  >
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                )}
                <Badge variant="secondary" className="text-xs">
                  {new Date(result.created_at).toLocaleDateString()}
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 w-7 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this question set?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove these interview questions. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(result.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Technical */}
            {Array.isArray(result.technical) && result.technical.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-heading">Technical</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.technical.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <span className="text-sm font-medium text-primary mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-foreground">{q}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Behavioral */}
            {Array.isArray(result.behavioral) && result.behavioral.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-heading">Behavioral</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.behavioral.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <span className="text-sm font-medium text-primary mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-foreground">{q}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Situational */}
            {Array.isArray(result.situational) && result.situational.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-heading">Situational</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.situational.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <span className="text-sm font-medium text-primary mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-foreground">{q}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommended Resources */}
            {result.recommended_resources?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-heading">Recommended Resources</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on the job description, these resources can help you prepare.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.recommended_resources.map((rec) => {
                    const resource = getResourceById(rec.resource_id);
                    if (!resource) {
                      // Resource ID not in catalog — show reason-only fallback
                      return (
                        <div key={rec.resource_id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                          <div className="shrink-0 mt-0.5 h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground">Resource unavailable</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                          </div>
                        </div>
                      );
                    }
                    const TypeIcon = RESOURCE_TYPE_ICONS[resource.type];
                    const typeLabel = RESOURCE_TYPE_LABELS[resource.type];
                    return (
                      <div key={rec.resource_id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                        <div className="shrink-0 mt-0.5 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                          <TypeIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-foreground">{resource.name}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                              {typeLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.reason}</p>
                        </div>
                        {resource.isExternal ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </Button>
                          </a>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 h-7 gap-1 text-xs"
                            onClick={() => navigate(resource.url)}
                          >
                            Read
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {/* Question History */}
        {allResults.length > 1 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-heading">Previous Question Sets</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {allResults.filter(r => r.id !== result?.id).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <button
                    className="flex-1 text-left"
                    onClick={() => setResult(r)}
                  >
                    <p className="text-sm font-medium text-foreground truncate max-w-[400px]">
                      {r.job_description.slice(0, 80)}{r.job_description.length > 80 ? '…' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(Array.isArray(r.technical) ? r.technical.length : 0) + (Array.isArray(r.behavioral) ? r.behavioral.length : 0) + (Array.isArray(r.situational) ? r.situational.length : 0)} questions · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(r.id)}
                    className="text-destructive hover:text-destructive shrink-0 ml-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <AICreditLimitDialog
          open={showCreditLimitDialog}
          onOpenChange={setShowCreditLimitDialog}
          maxActions={maxActions}
        />
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;
