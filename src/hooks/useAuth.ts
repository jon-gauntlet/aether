import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../core/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        setAuthState({
          user,
          loading: false,
          error: null
        });
      },
      (error) => {
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Auth error')
        });
      }
    );

    return () => unsubscribe();
  }, []);

  return authState;
} 