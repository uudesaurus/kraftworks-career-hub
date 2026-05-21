import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { feedbackApi } from '@/lib/api';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────

export interface GeneratedFeedback {
  id: string;
  resume_id: string;
  resume_hash: string;
  status: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  overall_score: number | null;
  trade_suggestions: string[];
  actionable_steps: string[];
  score_breakdown: { formatting: number; content: number; trade_relevance: number; impact: number } | null;
  motivation_note: string | null;
  created_at: string;
}

interface GenerationState {
  isGenerating: boolean;
  currentPhase: 0 | 1 | 2 | 3 | 4;
  phaseStartedAt: number | null;
  error: string | null;
  feedbackResult: GeneratedFeedback | null;
  /** The resume_id this feedback belongs to — used to invalidate stale cache */
  resumeId: string | null;
}

interface FeedbackGenerationContextValue extends GenerationState {
  startGeneration: () => void;
  clearResult: () => void;
  clearError: () => void;
  /** Call when resume changes to invalidate cached feedback */
  invalidateForResume: (currentResumeId: string | null) => void;
}

const STORAGE_KEY = 'kw_feedback_generation';
const PHASE_DURATION = 5000; // 5 seconds per visual phase
const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes = stale

// ── localStorage helpers ───────────────────────────────

function loadState(): GenerationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GenerationState;
  } catch {
    return null;
  }
}

function saveState(state: GenerationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — ignore */ }
}

function clearStorage() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ── Default state ──────────────────────────────────────

const defaultState: GenerationState = {
  isGenerating: false,
  currentPhase: 0,
  phaseStartedAt: null,
  error: null,
  feedbackResult: null,
  resumeId: null,
};

// ── Context ────────────────────────────────────────────

const FeedbackGenerationContext = createContext<FeedbackGenerationContextValue | null>(null);

export function useFeedbackGeneration() {
  const ctx = useContext(FeedbackGenerationContext);
  if (!ctx) throw new Error('useFeedbackGeneration must be used within FeedbackGenerationProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────

export function FeedbackGenerationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GenerationState>(() => {
    const saved = loadState();
    if (!saved) return defaultState;

    // If we find an in-progress generation that's stale (>5 min), clear it
    if (saved.isGenerating && saved.phaseStartedAt) {
      const elapsed = Date.now() - saved.phaseStartedAt;
      if (elapsed > STALE_THRESHOLD) {
        clearStorage();
        return defaultState;
      }
      // Generation was in-flight when page was closed — jump to phase 4 (checking)
      return { ...saved, currentPhase: 4 as const, isGenerating: true };
    }

    // If we have a result cached but generation is done, keep it
    // (it will be validated against current resume ID later via invalidateForResume)
    if (!saved.isGenerating && saved.feedbackResult) {
      return saved;
    }

    return defaultState;
  });

  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiPromiseRef = useRef<Promise<any> | null>(null);
  const isRecoveringRef = useRef(false);

  // Persist state changes to localStorage
  useEffect(() => {
    if (state.isGenerating || state.feedbackResult || state.error) {
      saveState(state);
    } else {
      clearStorage();
    }
  }, [state]);

  // Phase timer: advance phases based on elapsed time
  const startPhaseTimer = useCallback((startedAt: number) => {
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);

    phaseTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      let phase: 1 | 2 | 3 | 4;
      if (elapsed < PHASE_DURATION) phase = 1;
      else if (elapsed < PHASE_DURATION * 2) phase = 2;
      else if (elapsed < PHASE_DURATION * 3) phase = 3;
      else phase = 4;

      setState(prev => {
        if (!prev.isGenerating) return prev;
        if (prev.currentPhase === phase) return prev;
        return { ...prev, currentPhase: phase };
      });
    }, 250);
  }, []);

  const stopPhaseTimer = useCallback(() => {
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPhaseTimer();
  }, [stopPhaseTimer]);

  // On mount: if we recovered a stale generation, try to fetch results
  useEffect(() => {
    if (state.isGenerating && state.currentPhase === 4 && !apiPromiseRef.current && !isRecoveringRef.current) {
      isRecoveringRef.current = true;

      // Check if the API already completed while we were away
      feedbackApi.list().then(data => {
        const items = data.feedback || [];
        const latest = items[0];
        if (latest) {
          // Feedback exists on server — show it
          setState({
            isGenerating: false,
            currentPhase: 0,
            phaseStartedAt: null,
            error: null,
            feedbackResult: latest,
            resumeId: latest.resume_id || null,
          });
          toast.success('Your resume feedback is ready!');
        } else {
          // No feedback found — the generation probably failed silently
          setState({
            ...defaultState,
            error: 'Generation may not have completed. Please try again.',
          });
        }
        isRecoveringRef.current = false;
      }).catch((err: any) => {
        console.warn('[FeedbackGeneration] Recovery check failed:', err);
        setState({
          ...defaultState,
          error: 'Could not check feedback status. Please try again.',
        });
        isRecoveringRef.current = false;
      });
    }
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGeneration = useCallback(() => {
    if (state.isGenerating) return; // prevent double-click

    const now = Date.now();

    setState(prev => ({
      isGenerating: true,
      currentPhase: 1,
      phaseStartedAt: now,
      error: null,
      feedbackResult: null,
      resumeId: prev.resumeId,
    }));

    // Start visual phase timer
    startPhaseTimer(now);

    // Fire API call in parallel with visual phases
    const promise = feedbackApi.generate();
    apiPromiseRef.current = promise;

    promise
      .then((data) => {
        stopPhaseTimer();
        // The API returns the feedback object directly
        const result: GeneratedFeedback = data.feedback || data;
        setState({
          isGenerating: false,
          currentPhase: 0,
          phaseStartedAt: null,
          error: null,
          feedbackResult: result,
          resumeId: result.resume_id || null,
        });
        toast.success('Your resume feedback is ready!');
      })
      .catch((err: any) => {
        stopPhaseTimer();
        setState(prev => ({
          isGenerating: false,
          currentPhase: 0,
          phaseStartedAt: null,
          error: err.message || 'Failed to generate feedback. Please try again.',
          feedbackResult: null,
          resumeId: prev.resumeId,
        }));
        toast.error(err.message || 'Failed to generate feedback.');
      })
      .finally(() => {
        apiPromiseRef.current = null;
      });
  }, [state.isGenerating, startPhaseTimer, stopPhaseTimer]);

  const clearResult = useCallback(() => {
    setState(defaultState);
    clearStorage();
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Invalidate cached feedback if the resume has changed
  const invalidateForResume = useCallback((currentResumeId: string | null) => {
    setState(prev => {
      // No cached result — nothing to invalidate
      if (!prev.feedbackResult) return prev;
      // If resume ID matches, cache is valid
      if (currentResumeId && prev.resumeId === currentResumeId) return prev;
      // Resume changed or deleted — clear stale feedback
      clearStorage();
      return defaultState;
    });
  }, []);

  return (
    <FeedbackGenerationContext.Provider
      value={{
        ...state,
        startGeneration,
        clearResult,
        clearError,
        invalidateForResume,
      }}
    >
      {children}
    </FeedbackGenerationContext.Provider>
  );
}
