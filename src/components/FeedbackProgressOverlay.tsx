import { useEffect, useState } from 'react';
import { useFeedbackGeneration } from '@/contexts/FeedbackGenerationContext';
import { FileText, Brain, Pencil, CheckCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Phase definitions ──────────────────────────────────

const PHASES = [
  {
    id: 1,
    label: 'Uploading & Parsing',
    description: 'Reading your resume content...',
    Icon: FileText,
  },
  {
    id: 2,
    label: 'Analyzing Skills & Experience',
    description: 'Matching against industry standards...',
    Icon: Brain,
  },
  {
    id: 3,
    label: 'Generating Recommendations',
    description: 'Crafting personalized suggestions...',
    Icon: Pencil,
  },
  {
    id: 4,
    label: 'Finalizing Your Report',
    description: 'Almost there — putting it all together...',
    Icon: Sparkles,
  },
] as const;

const PHASE_DURATION = 5000;

// ── Component ──────────────────────────────────────────

export function FeedbackProgressOverlay() {
  const { currentPhase, phaseStartedAt, error, startGeneration, clearError } = useFeedbackGeneration();
  const [elapsed, setElapsed] = useState(0);

  // Tick elapsed every 100ms for smooth progress
  useEffect(() => {
    if (!phaseStartedAt) return;
    const tick = setInterval(() => {
      setElapsed(Date.now() - phaseStartedAt);
    }, 100);
    return () => clearInterval(tick);
  }, [phaseStartedAt]);

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Generation Failed</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => { clearError(); startGeneration(); }}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Calculate progress percentage (0-100)
  const getProgress = () => {
    if (currentPhase === 0) return 0;
    // Phases 1-3: each fills 25% over 5s
    const phaseBasePercent = (currentPhase - 1) * 25;
    if (currentPhase <= 3) {
      const phaseStart = (currentPhase - 1) * PHASE_DURATION;
      const phaseElapsed = Math.max(0, elapsed - phaseStart);
      const phaseProgress = Math.min(phaseElapsed / PHASE_DURATION, 1);
      return phaseBasePercent + phaseProgress * 25;
    }
    // Phase 4: slowly creep from 75% toward 95% (asymptotic)
    const phase4Start = 3 * PHASE_DURATION;
    const phase4Elapsed = Math.max(0, elapsed - phase4Start);
    // Logarithmic approach to 95%: starts fast, slows down
    const phase4Progress = 1 - Math.exp(-phase4Elapsed / 30000);
    return 75 + phase4Progress * 20; // 75% → ~95%
  };

  const progress = getProgress();
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const showSlowWarning = elapsed > 60000; // > 60s

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Generating Your Feedback</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {elapsedSeconds}s elapsed
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* Segment markers */}
        <div className="absolute inset-0 flex">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="border-r border-background/40"
              style={{ width: '25%' }}
            />
          ))}
        </div>
      </div>

      {/* Phase checklist */}
      <div className="space-y-2">
        {PHASES.map((phase) => {
          const isCompleted = currentPhase > phase.id || (currentPhase === 0 && progress === 100);
          const isActive = currentPhase === phase.id;
          const isUpcoming = currentPhase < phase.id;

          return (
            <div
              key={phase.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300',
                isActive && 'bg-primary/5 border border-primary/20',
                isCompleted && 'bg-muted/50',
                isUpcoming && 'opacity-40',
              )}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <phase.Icon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-foreground' : isCompleted ? 'text-foreground' : 'text-muted-foreground',
                )}>
                  {phase.label}
                </p>
                {(isActive || isCompleted) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isActive ? phase.description : 'Done'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slow generation warning */}
      {showSlowWarning && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Taking longer than expected — please hang tight...
        </p>
      )}
    </div>
  );
}

// ── Global banner for other pages ──────────────────────

export function FeedbackGenerationBanner() {
  const { isGenerating, currentPhase } = useFeedbackGeneration();

  if (!isGenerating) return null;

  const activePhase = PHASES.find(p => p.id === currentPhase);

  return (
    <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
        <p className="text-xs text-foreground truncate">
          <span className="font-medium">Generating resume feedback</span>
          {activePhase && (
            <span className="text-muted-foreground"> — {activePhase.label.toLowerCase()}</span>
          )}
        </p>
      </div>
      <a
        href="/resume-review"
        className="text-xs font-medium text-primary hover:underline shrink-0"
      >
        View Progress
      </a>
    </div>
  );
}
