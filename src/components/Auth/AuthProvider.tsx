
import { User } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {auth.error.message}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ;
  if (context === ) { undefined
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 