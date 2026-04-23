import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { feedbackApi } from '@/lib/api';
import { toast } from 'sonner';

export interface ScoreBreakdown {
  formatting: number;
  content: number;
  trade_relevance: number;
  impact: number;
}

export interface ResumeFeedback {
  id: string;
  resume_id: string;
  resume_hash: string;
  status: string;
  rejection_reason?: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  overall_score: number | null;
  trade_suggestions: string[];
  actionable_steps: string[];
  score_breakdown: ScoreBreakdown | null;
  motivation_note: string | null;
  created_at: string;
}

export function useResumeFeedback() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);
  const [allFeedback, setAllFeedback] = useState<ResumeFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await feedbackApi.list();
      const items = data.feedback || [];
      setAllFeedback(items);
      setFeedback(items[0] || null);
    } catch {
      setAllFeedback([]);
      setFeedback(null);
    }
    setLoading(false);
  };

  const deleteFeedback = async (id: string) => {
    try {
      await feedbackApi.delete(id);
      setAllFeedback(prev => prev.filter(f => f.id !== id));
      if (feedback?.id === id) {
        const remaining = allFeedback.filter(f => f.id !== id);
        setFeedback(remaining[0] || null);
      }
      toast.success('Feedback deleted.');
    } catch {
      toast.error('Failed to delete feedback.');
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchFeedback(); }, [user]);

  return { feedback, allFeedback, loading, fetchFeedback, deleteFeedback };
}
