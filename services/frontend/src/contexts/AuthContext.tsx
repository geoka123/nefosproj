import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI, tokenStorage } from '../lib/api';
import type { User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    password2: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = tokenStorage.getUser();
      const token = tokenStorage.getAccessToken();

      if (storedUser && token) {
        try {
          // Verify token is still valid by fetching current user
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
          tokenStorage.setUser(currentUser);
        } catch (error) {
          // Token invalid, clear storage
          tokenStorage.clearTokens();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    setUser(response.user);
  };

  const signup = async (
    email: string,
    password: string,
    password2: string,
    firstName?: string,
    lastName?: string
  ) => {
    const response = await authAPI.signup(email, password, password2, firstName, lastName);
    setUser(response.user);
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      tokenStorage.setUser(currentUser);
    } catch (error) {
      // If refresh fails, logout
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
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

