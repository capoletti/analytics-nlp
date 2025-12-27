import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface AuthContextValue {
  tenant: string | null;
  isAuthenticated: boolean;
  login: (tenant: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'analytics_tenant';

// Extract tenant from URL if available (from query param or localStorage)
function extractTenantFromURL(): string | null {
  // First try to get from query params
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  if (tenantParam) return tenantParam;
  
  // Fallback: try common tenants based on known patterns
  // This is for direct navigation without login
  return null;
}

export function AuthProvider({ children }: { children: (value: AuthContextValue) => ReactNode }) {
  const [searchParams] = useSearchParams();
  
  const [tenant, setTenant] = useState<string | null>(() => {
    // Initialize from localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    
    // Fallback to URL parameter
    return extractTenantFromURL();
  });

  // Update tenant when URL query params change
  useEffect(() => {
    const tenantParam = searchParams.get('tenant');
    if (tenantParam && tenantParam !== tenant) {
      setTenant(tenantParam);
      localStorage.setItem(STORAGE_KEY, tenantParam);
    }
  }, [searchParams, tenant]);

  const login = useCallback((tenantId: string) => {
    setTenant(tenantId);
    localStorage.setItem(STORAGE_KEY, tenantId);
  }, []);

  const logout = useCallback(() => {
    setTenant(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Persist tenant to localStorage whenever it changes
  useEffect(() => {
    if (tenant) {
      localStorage.setItem(STORAGE_KEY, tenant);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [tenant]);

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
