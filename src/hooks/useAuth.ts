import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../core/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setAuthState({
        user,
        loading: false
      });
    });

    return () => unsubscribe();
  }, []);

  return authState;
}