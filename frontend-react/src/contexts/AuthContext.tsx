import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { tokenStorage, UNAUTHORIZED_EVENT } from '@/services/api';
import { authService } from '@/services/authService';

interface AuthContextValue {
  tenant: string | null;
  isAuthenticated: boolean;
  login: (tenant: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'analytics_tenant';

export function AuthProvider({ children }: { children: (value: AuthContextValue) => ReactNode }) {
  // The tenant is only trusted alongside a server-issued token; the backend enforces the binding.
  const [tenant, setTenant] = useState<string | null>(() =>
    tokenStorage.get() ? localStorage.getItem(STORAGE_KEY) : null
  );

  const login = useCallback(async (tenantId: string, password: string) => {
    const { access_token, tenant: authenticatedTenant } = await authService.login(
      tenantId,
      password
    );
    tokenStorage.set(access_token);
    localStorage.setItem(STORAGE_KEY, authenticatedTenant);
    setTenant(authenticatedTenant);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem(STORAGE_KEY);
    setTenant(null);
  }, []);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const value: AuthContextValue = {
    tenant,
    isAuthenticated: tenant !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children(value)}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
