import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface AuthUser { email: string; name: string }
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('idToken');
    const stored = localStorage.getItem('user');
    if (token && stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ idToken: string; accessToken: string }>('/auth/login', { email, password });
    localStorage.setItem('idToken', data.idToken);
    const u = { email, name: email.split('@')[0] };
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const signup = async (email: string, password: string, name: string) => {
    await api.post('/auth/signup', { email, password, name });
  };

  const logout = () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
