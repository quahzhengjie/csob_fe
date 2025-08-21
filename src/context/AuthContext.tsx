// =================================================================================
// FILE: src/context/AuthContext.tsx - Add checkTokenExpiry
// =================================================================================
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthRequest, AuthResponse } from '@/types/entities';
import { API_BASE_URL } from '@/lib/apiClient';

interface AuthContextType {
  user: AuthResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authRequest: AuthRequest) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  clearAuth: () => void; // Add this for API client to call
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
        
        // Optional: Check if token is expired based on expiresIn
        if (userData.expiresIn) {
          const tokenAge = Date.now() - (parseInt(localStorage.getItem('authTimestamp') || '0'));
          if (tokenAge > userData.expiresIn * 1000) {
            // Token expired
            clearAuth();
            window.location.href = '/login?session=expired';
            return;
          }
        }
        
        setToken(storedToken);
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      clearAuth();
    }
    setIsLoading(false);
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('authTimestamp');
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
    localStorage.setItem('authTimestamp', Date.now().toString()); // Store login time
  };

  const logout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  }, [user]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
        clearAuth,
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