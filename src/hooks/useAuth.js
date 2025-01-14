import { useState, useEffect } from 'react';
import { auth } from '../firebase';

/**
 * @typedef {Object} AuthState
 * @property {import('firebase/auth').User|null} user
 * @property {boolean} loading
 */

/**
 * Hook for managing authentication state
 * @returns {AuthState}
 */
export function useAuth() {
  const [state, setState] = useState({
    user: null,
    loading: true
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setState({
        user,
        loading: false
      });
    });

    return () => unsubscribe();
  }, []);

  return state;
} 