/**
 * useAuth Hook
 * Manages Firebase Authentication state
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, signInAnonymous, signOut } from '../services/firebase/auth';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthActions {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Hook to manage authentication state
 * @returns {AuthState & AuthActions} Auth state and actions
 */
export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChanged(
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Auth state error:', err);
        setError(err as Error);
        setLoading(false);
      },
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAnonymous();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}
