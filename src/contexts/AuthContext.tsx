'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, getProfile, logout, storeAuthData, getStoredUser, isAuthenticated } from '@/lib/api/auth';
import { User } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      if (isAuthenticated()) {
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Try to get fresh user data from server
          const response = await getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            storeAuthData(response.data, localStorage.getItem('token') || '');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await login({ email, password });
      if (response.success && response.data) {
        const { user, token } = response.data;
        storeAuthData(user, token);
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign in failed:', error);
      return false;
    }
  };

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await register({ name, email, password });
      if (response.success && response.data) {
        const { user, token } = response.data;
        storeAuthData(user, token);
        setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign up failed:', error);
      return false;
    }
  };

  const signOut = () => {
    logout();
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
