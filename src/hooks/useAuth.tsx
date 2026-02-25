/**
 * Authentication hook
 * Manages user authentication state and operations
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { VibexeApp } from '@vibexe/sdk';
import { User, AuthView } from '../types';

const app = new VibexeApp({ appId: 'bldr_fcjZ7dIk2Ahq3xsZbHJhW' });

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  currentView: AuthView;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentView: (view: AuthView) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AuthView>('signup');

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await app.auth.getCurrentUser();
        if (currentUser) {
          setUser(currentUser as unknown as User);
        }
      } catch (err) {
        // Session expired or invalid, user stays logged out
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await app.auth.signUp({ email, password, displayName });
      setUser(response.user as unknown as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await app.auth.signIn({ email, password });
      setUser(response.user as unknown as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await app.auth.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    currentView,
    signUp,
    signIn,
    signOut,
    setCurrentView,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
