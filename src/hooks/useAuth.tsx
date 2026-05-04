import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect, useMemo } from 'react';
import { setTokenGetter } from '@/lib/api';

const SANDBOX_MODE = import.meta.env.VITE_SANDBOX_MODE === 'true';

// Sandbox mock user — matches the user auto-created by the backend sandbox auth
const SANDBOX_USER = {
  id: 'sandbox_user_001',
  email: 'sandbox@kraftworks.test',
  user_metadata: {
    full_name: 'Sandbox User',
  },
};

// Simplified auth hook wrapping Clerk (or sandbox mock)
export function useAuth() {
  if (SANDBOX_MODE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      setTokenGetter(async () => 'sandbox_token');
    }, []);

    return {
      user: SANDBOX_USER,
      loading: false,
      signOut: async () => { window.location.href = '/'; },
      getToken: async () => 'sandbox_token' as string | null,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, isLoaded, isSignedIn } = useUser();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { getToken, signOut: clerkSignOut } = useClerkAuth();

  // Register the token getter for our API client
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [getToken]);

  const signOut = async () => {
    await clerkSignOut();
  };

  // Memoize the user object to prevent infinite re-renders in consuming hooks
  const userId = isSignedIn ? user?.id : null;
  const userEmail = isSignedIn ? user?.primaryEmailAddress?.emailAddress || '' : '';
  const userFullName = isSignedIn ? user?.fullName || '' : '';

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const memoizedUser = useMemo(() => {
    if (!userId) return null;
    return {
      id: userId,
      email: userEmail,
      user_metadata: {
        full_name: userFullName,
      },
    };
  }, [userId, userEmail, userFullName]);

  return {
    user: memoizedUser,
    loading: !isLoaded,
    signOut,
    getToken,
  };
}

// No AuthProvider needed — ClerkProvider handles everything in App.tsx
// Export a no-op for backward compatibility
export const AuthProvider = ({ children }: { children: React.ReactNode }) => children;
