import { useState, useEffect, createContext, useContext } from 'react';
import { auth } from '@/core/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(undefined);

/**
 * @typedef {Object} AuthState
 * @property {import('firebase/auth').User|null} user
 * @property {string} consciousnessState
 */

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [consciousnessState, setConsciousnessState] = useState('active');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, consciousnessState }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @returns {AuthState}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}; 