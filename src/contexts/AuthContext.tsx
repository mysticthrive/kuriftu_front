'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

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
    // Mock auth check - just check if token exists
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
      // Mock user data - you can customize this
      const mockUser = {
        id: 1,
        name: 'Demo User',
        email: 'demo@example.com',
        created_at: new Date().toISOString()
      };
      setUser(mockUser);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - accept any email/password
    const mockUser = {
      id: 1,
      name: email.split('@')[0] || 'User',
      email: email,
      created_at: new Date().toISOString()
    };
    
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    localStorage.setItem('authToken', mockToken);
    setUser(mockUser);
    return true;
  };

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    // Mock registration - accept any data
    const mockUser = {
      id: 1,
      name: name,
      email: email,
      created_at: new Date().toISOString()
    };
    
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    localStorage.setItem('authToken', mockToken);
    setUser(mockUser);
    return true;
  };

  const signOut = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    router.push('/signin');
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
