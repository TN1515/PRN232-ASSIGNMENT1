import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

export interface User {
  id: number;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Validate token by checking if it can access the /me endpoint.
 * Returns:
 *  - 'valid' when token is accepted (2xx)
 *  - 'unauthorized' when server returns 401
 *  - 'error' for network/other transient errors (do NOT clear auth on these)
 */
const validateToken = async (token: string): Promise<'valid' | 'unauthorized' | 'error'> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) return 'unauthorized';
    if (response.ok) return 'valid';
    // Other non-OK responses (e.g., 5xx) treat as transient error
    console.warn('Token validation returned non-OK status:', response.status);
    return 'error';
  } catch (error) {
    console.warn('Token validation failed (network/error):', error);
    return 'error';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage without auto-validation
  // This ensures app loads with no user logged in by default
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Don't restore from localStorage - start as logged out
        // Token validation will only happen when explicitly needed (e.g., on protected pages)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        console.log('ℹ️ App initialized with no user logged in (auto-validation disabled)');
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
