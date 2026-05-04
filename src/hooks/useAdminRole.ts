import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userApi } from '@/lib/api';

export function useAdminRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }

    const check = async () => {
      try {
        const data = await userApi.getProfile();
        setIsAdmin(data.role === 'admin');
      } catch {
        setIsAdmin(false);
      }
      setLoading(false);
    };
    check();
  }, [user]);

  return { isAdmin, loading };
}
