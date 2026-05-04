import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userApi } from '@/lib/api';

const MAX_AI_ACTIONS = 9;

interface AIUsageData {
  used: number;
  max: number;
  remaining: number;
}

export function useAIUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<AIUsageData>({ used: 0, max: MAX_AI_ACTIONS, remaining: MAX_AI_ACTIONS });
  const [loading, setLoading] = useState(true);
  const [optimisticOffset, setOptimisticOffset] = useState(0);

  const fetchUsage = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await userApi.getDashboard();
      setUsage(data.aiUsage || { used: 0, max: MAX_AI_ACTIONS, remaining: MAX_AI_ACTIONS });
      setOptimisticOffset(0); // sync with server resets the offset
    } catch {
      // fallback
    }
    setLoading(false);
  };

  const optimisticDecrement = () => setOptimisticOffset(prev => prev + 1);
  const optimisticRefund = () => setOptimisticOffset(prev => Math.max(0, prev - 1));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsage(); }, [user]);

  return {
    usageRecords: [],
    loading,
    remaining: usage.remaining - optimisticOffset,
    maxActions: usage.max,
    used: usage.used + optimisticOffset,
    fetchUsage,
    optimisticDecrement,
    optimisticRefund,
  };
}
