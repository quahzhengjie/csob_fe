// =================================================================================
// FILE: src/context/AuthContext.tsx
// =================================================================================
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthRequest, AuthResponse } from '@/types/entities'; // Assuming User and Role are also in entities
import { API_BASE_URL } from '@/lib/apiClient';


interface AuthContextType {
  user: AuthResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authRequest: AuthRequest) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On initial app load, try to rehydrate the auth state from localStorage
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      
      if (storedToken && storedUser) {
        const userData: AuthResponse = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      // Clear potentially corrupt data from storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    setIsLoading(false);
  }, []);

  const login = async (authRequest: AuthRequest) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    
    setToken(data.jwt);
    setUser(data);
    
    // Store token and user data upon successful login
    localStorage.setItem('authToken', data.jwt);
    localStorage.setItem('authUser', JSON.stringify(data));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Clear all auth-related items from storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = '/login'; // Redirect to login page
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    // Check if the user's permissions set includes the required permission
    return user.permissions.includes(permission);
  }, [user]);

  // Don't render the rest of the app until the auth state has been loaded from storage
  if (isLoading) {
    return null; // Or you can return a full-page loading spinner here
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        token, 
        isAuthenticated: !!token && !!user, 
        isLoading, 
        login, 
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
