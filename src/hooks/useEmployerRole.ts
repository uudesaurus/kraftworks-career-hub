import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userApi } from '@/lib/api';

export function useEmployerRole() {
  const { user } = useAuth();
  const [isEmployer, setIsEmployer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsEmployer(false); setLoading(false); return; }

    const check = async () => {
      try {
        const data = await userApi.getProfile();
        setIsEmployer(data.role === 'employer' || data.role === 'admin');
      } catch {
        setIsEmployer(false);
      }
      setLoading(false);
    };
    check();
  }, [user]);

  return { isEmployer, loading };
}
