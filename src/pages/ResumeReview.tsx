import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Upload, FileText, Trash2, AlertCircle, Sparkles, CheckCircle, XCircle, History, CircleCheck, CircleAlert, MessageSquareText, Hammer, ClipboardList, Download, Mail, Loader2 } from 'lucide-react';
import { useResume } from '@/hooks/useResume';
import { useAIUsage } from '@/hooks/useAIUsage';
import { useResumeFeedback, type ResumeFeedback } from '@/hooks/useResumeFeedback';
import { useFeedbackGeneration, type GeneratedFeedback } from '@/contexts/FeedbackGenerationContext';
import { FeedbackProgressOverlay } from '@/components/FeedbackProgressOverlay';
import { AICreditLimitDialog } from '@/components/AICreditLimitDialog';
import { feedbackApi } from '@/lib/api';
import { toast } from 'sonner';
import { useRef, useCallback, useState, useEffect } from 'react';

/* ── Render markdown bold ── */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-medium text-foreground">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

/* ── Score ring — floor at 6, uses primary color ── */
function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const displayScore = Math.max(6, score);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 10) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute top-0 left-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-border" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={5} strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="text-center">
        <span className="text-xl font-bold text-foreground">{displayScore}</span>
        <span className="text-[10px] text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

/* ── Score breakdown bar — uses muted palette ── */
function ScoreBar({ label, value }: { label: string; value: number }) {
  const displayValue = Math.max(6, value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground tabular-nums">{displayValue}/10</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${(displayValue / 10) * 100}%` }} />
      </div>
    </div>
  );
}

/* ── Section component — shadcn Card-like styling ── */
function FeedbackSection({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
}) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <Badge variant="secondary" className="ml-auto text-[10px]">{items.length}</Badge>
      </div>
      <div className="px-4 py-3 space-y-3">
        {items.map((item: string, i: number) => (
          <div key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <span className="mt-2 h-1 w-1 rounded-full shrink-0 bg-muted-foreground/40" />
            <div className="flex-1">
              <RichText text={item} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feedback display card (reusable for current + history) ── */
function FeedbackDisplay({ data, label, onEmail, emailing }: {
  data: GeneratedFeedback | ResumeFeedback;
  label?: string;
  onEmail?: () => void;
  emailing?: boolean;
}) {
  const score = data.overall_score ?? 0;
  const breakdown = (data as any).score_breakdown;
  const motivationNote = (data as any).motivation_note;

  const handleDownload = useCallback(() => {
    // Build a styled HTML document for printing/saving as PDF
    const html = buildFeedbackHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume-Feedback-${new Date(data.created_at).toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Feedback report downloaded!');
  }, [data]);

  return (
    <div className="space-y-4">
      {label && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      )}

      {/* Score header with ring + breakdown */}
      {score > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-center shrink-0">
              <ScoreRing score={score} />
              <p className="text-[11px] text-muted-foreground mt-1.5">Overall</p>
            </div>
            {breakdown && (
              <div className="flex-1 w-full space-y-2.5">
                <ScoreBar label="Formatting & Layout" value={breakdown.formatting} />
                <ScoreBar label="Content Quality" value={breakdown.content} />
                <ScoreBar label="Trade Relevance" value={breakdown.trade_relevance} />
                <ScoreBar label="Hiring Impact" value={breakdown.impact} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Motivation note */}
      {motivationNote && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {motivationNote}
          </p>
        </div>
      )}

      <FeedbackSection
        icon={CircleCheck}
        title="What's Working Well"
        items={data.strengths}
      />

      <FeedbackSection
        icon={CircleAlert}
        title="Areas to Strengthen"
        items={data.improvements}
      />

      <FeedbackSection
        icon={MessageSquareText}
        title="Recommendations"
        items={data.suggestions}
      />

      <FeedbackSection
        icon={Hammer}
        title="Trade-Specific Tips"
        items={data.trade_suggestions}
      />

      <FeedbackSection
        icon={ClipboardList}
        title="Your Next Steps"
        items={data.actionable_steps}
      />

      {/* Save / Download / Email actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-3.5 w-3.5" />
          Save Report
        </Button>
        {onEmail && (
          <Button variant="outline" size="sm" onClick={onEmail} disabled={emailing}>
            {emailing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-2 h-3.5 w-3.5" />}
            {emailing ? 'Sending...' : 'Email to Me'}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Build downloadable HTML report with Kraftworks branding ── */
function buildFeedbackHTML(data: GeneratedFeedback | ResumeFeedback): string {
  const rawScore = data.overall_score ?? 0;
  const score = Math.max(6, rawScore);
  const breakdown = (data as any).score_breakdown;
  const motivationNote = (data as any).motivation_note;
  const date = new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderItems(items: string[]): string {
    return items.map(item => {
      const html = escapeHtml(item).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<li style="padding:8px 0;border-bottom:1px solid #f0f0f0;line-height:1.7;color:#444;font-size:13px;">${html}</li>`;
    }).join('');
  }

  function section(title: string, items: string[], emoji: string): string {
    if (!items?.length) return '';
    return `<div style="margin:24px 0;">
      <h3 style="font-size:14px;color:#111;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin:0 0 12px;">${emoji} ${escapeHtml(title)} <span style="color:#9ca3af;font-weight:normal;font-size:11px;">(${items.length})</span></h3>
      <ul style="list-style:none;margin:0;padding:0;">${renderItems(items)}</ul>
    </div>`;
  }

  const brandColor = '#2563eb';

  const breakdownHtml = breakdown ? `<div style="background:#f8fafc;padding:16px 20px;border-radius:8px;margin:20px 0;border:1px solid #e5e7eb;">
    <h3 style="margin:0 0 14px;font-size:13px;color:#333;font-weight:600;">Score Breakdown</h3>
    ${['Formatting & Layout', 'Content Quality', 'Trade Relevance', 'Hiring Impact'].map((label, i) => {
      const key = ['formatting', 'content', 'trade_relevance', 'impact'][i];
      const val = Math.max(6, breakdown[key] ?? 0);
      return `<div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
          <span style="color:#6b7280;">${label}</span>
          <span style="font-weight:600;color:#111;">${val}/10</span>
        </div>
        <div style="background:#e5e7eb;border-radius:4px;height:6px;overflow:hidden;">
          <div style="background:${brandColor};height:100%;width:${(val / 10) * 100}%;border-radius:4px;"></div>
        </div>
      </div>`;
    }).join('')}
  </div>` : '';

  const motivationHtml = motivationNote ? `<div style="background:#f9fafb;border-left:3px solid ${brandColor};padding:14px 16px;margin:20px 0;border-radius:0 6px 6px 0;">
    <p style="margin:0;color:#374151;line-height:1.6;font-size:13px;">${escapeHtml(motivationNote)}</p>
  </div>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Resume Feedback Report — Kraftworks Career Hub</title>
<style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>
</head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;color:#111827;">
  <div style="text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e5e7eb;">
    <div style="font-size:20px;font-weight:700;color:${brandColor};letter-spacing:-0.5px;">Kraftworks</div>
    <div style="font-size:11px;color:#9ca3af;margin-top:2px;">Career Hub</div>
  </div>
  <div style="text-align:center;margin-bottom:8px;">
    <h1 style="font-size:20px;margin:0;font-weight:600;">Resume Feedback Report</h1>
    <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">${escapeHtml(date)}</p>
  </div>
  <div style="text-align:center;margin:24px 0;">
    <div style="display:inline-block;width:72px;height:72px;border-radius:50%;border:3px solid ${brandColor};line-height:72px;font-size:24px;font-weight:700;color:${brandColor};">
      ${score}
    </div>
    <p style="margin:6px 0 0;color:#6b7280;font-size:11px;">Overall Score (out of 10)</p>
  </div>
  ${breakdownHtml}
  ${motivationHtml}
  ${section("What's Working Well", data.strengths, '✅')}
  ${section('Areas to Strengthen', data.improvements, '📌')}
  ${section('Recommendations', data.suggestions, '💬')}
  ${section('Trade-Specific Tips', data.trade_suggestions, '🔧')}
  ${section('Your Next Steps', data.actionable_steps, '📋')}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;">
  <p style="text-align:center;color:#9ca3af;font-size:10px;line-height:1.5;">
    &copy; ${new Date().getFullYear()} Kraftworks Career Hub&trade; &mdash; All rights reserved.<br/>
    Built for trade professionals.
  </p>
</body></html>`;
}

const ResumeReview = () => {
  const { resume, loading, uploading, uploadResume, deleteResume, fetchResume } = useResume();
  const { remaining, maxActions, optimisticDecrement, optimisticRefund, fetchUsage } = useAIUsage();
  const { feedback, allFeedback, loading: feedbackLoading, fetchFeedback, deleteFeedback } = useResumeFeedback();
  const {
    isGenerating, error: genError, feedbackResult,
    startGeneration, clearResult, invalidateForResume,
  } = useFeedbackGeneration();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [showCreditLimitDialog, setShowCreditLimitDialog] = useState(false);
  const [emailing, setEmailing] = useState(false);

  // Invalidate stale cached feedback whenever the active resume changes
  useEffect(() => {
    invalidateForResume(resume?.id ?? null);
  }, [resume?.id, invalidateForResume]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadResume(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadResume]);

  const handleReplaceFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Clear stale feedback FIRST (synchronously wipes localStorage)
    clearResult();
    await uploadResume(file);
    await fetchFeedback();
    if (replaceInputRef.current) replaceInputRef.current.value = '';
  }, [uploadResume, clearResult, fetchFeedback]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) await uploadResume(file);
  }, [uploadResume]);

  const handleDelete = useCallback(async () => {
    await deleteResume();
    clearResult();
  }, [deleteResume, clearResult]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Auto-show: display fresh generation result or server feedback that matches current resume
  const matchesCurrent = feedback && resume && feedback.resume_id === resume.id;
  const displayFeedback: GeneratedFeedback | ResumeFeedback | null = feedbackResult || (matchesCurrent ? feedback : null);

  // Viewing a history item?
  const historyItem = viewingHistoryId ? allFeedback.find(f => f.id === viewingHistoryId) : null;

  const handleGenerate = useCallback(() => {
    if (remaining <= 0) {
      setShowCreditLimitDialog(true);
      return;
    }

    optimisticDecrement();
    startGeneration();
  }, [remaining, optimisticDecrement, startGeneration]);

  const handleEmailFeedback = useCallback(async (feedbackId: string) => {
    setEmailing(true);
    try {
      const result = await feedbackApi.emailReport(feedbackId);
      toast.success(`Report sent to ${result.email || 'your email'}!`);
    } catch {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setEmailing(false);
    }
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      setShowCreditLimitDialog(true);
    }
  }, [remaining]);

  // When generation completes (feedbackResult becomes non-null), refresh usage from server
  const prevFeedbackResult = useRef(feedbackResult);
  if (feedbackResult && !prevFeedbackResult.current) {
    fetchUsage();
    fetchFeedback(); // sync server state after generation
  }
  prevFeedbackResult.current = feedbackResult;

  // History items excluding current latest
  const historyItems = allFeedback.filter(f => f.id !== feedback?.id);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Resume Review</h1>
          <p className="text-muted-foreground mt-1">
            Upload your resume and get straightforward, practical feedback.
          </p>
        </div>

        {/* Beta limits notice */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-accent border border-border">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Beta Limits</p>
            <p className="text-muted-foreground mt-0.5">
              1 resume (PDF only, max 2MB) · {remaining} of {maxActions} AI actions remaining
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">
              {resume ? 'Your Resume' : 'Upload Your Resume'}
            </CardTitle>
            <CardDescription>
              {resume
                ? 'You can replace your resume by uploading a new one.'
                : 'We\'ll review it and give you actionable feedback to help you stand out.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ) : resume ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resume.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(resume.file_size)} · Uploaded {new Date(resume.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">PDF</Badge>
                </div>
                <div className="flex gap-2">
                  {/* Replace with warning about feedback loss */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Replace'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Replace resume?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Uploading a new resume will replace your current one. Any existing feedback will be removed and you'll need to generate new feedback.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => replaceInputRef.current?.click()}>
                          Replace Resume
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete resume?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your uploaded resume and any associated feedback. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* AI Feedback section inline */}
                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-0.5">AI Resume Feedback</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Get actionable feedback on what's working, what to improve, and concrete next steps.
                  </p>
                  {feedbackLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  ) : isGenerating ? (
                    <FeedbackProgressOverlay />
                  ) : displayFeedback ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-foreground">Your Feedback</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                          >
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            Regenerate
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Generated {new Date(displayFeedback.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <FeedbackDisplay
                        data={displayFeedback}
                        onEmail={() => handleEmailFeedback(displayFeedback.id)}
                        emailing={emailing}
                      />
                    </div>
                  ) : genError ? (
                    <FeedbackProgressOverlay />
                  ) : (
                    <div>
                      <Button
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isGenerating || remaining <= 0}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get Resume Feedback
                      </Button>
                      {remaining <= 0 && (
                        <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-destructive/10 text-xs">
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
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { setDragOver(false); handleDrop(e); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-1">
                  Drag and drop your resume here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  PDF only (max 2MB)
                </p>
                <Button disabled={uploading} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <FileText className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Select File'}
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleReplaceFile}
            />
          </CardContent>
        </Card>

        {/* Feedback History - viewing a specific history item */}
        {historyItem && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-heading">
                    Feedback from {new Date(historyItem.created_at).toLocaleDateString()}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewingHistoryId(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <FeedbackDisplay
                data={historyItem}
                onEmail={() => handleEmailFeedback(historyItem.id)}
                emailing={emailing}
              />
              <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this feedback record. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => { deleteFeedback(historyItem.id); setViewingHistoryId(null); }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback History list */}
        {historyItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-heading">Previous Feedback</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {historyItems.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <button
                    className="flex-1 text-left"
                    onClick={() => setViewingHistoryId(f.id)}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {new Date(f.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {f.strengths?.length || 0} strengths · {f.improvements?.length || 0} areas to improve
                    </p>
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0 ml-2">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this feedback record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteFeedback(f.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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

export default ResumeReview;
