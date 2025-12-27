import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterState, FilterGroup, FilterItem } from '@/types/filters';

const DEFAULT_ADVANCED: FilterGroup = { logical: 'AND', items: [] };

const DEFAULT_FILTERS: FilterState = {
  advanced: DEFAULT_ADVANCED,
};

interface GlobalFiltersContextValue {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  addAdvancedFilter: (item: Omit<FilterItem, 'id'>) => void;
  updateAdvancedFilter: (id: string, patch: Partial<Omit<FilterItem, 'id'>>) => void;
  removeAdvancedFilter: (id: string) => void;
  setAdvancedLogical: (logical: FilterGroup['logical']) => void;
  resetFilters: () => void;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextValue | null>(null);

function parseFiltersFromSearch(searchParams: URLSearchParams): FilterState {
  // Advanced filters serialized as JSON string
  const advancedRaw = searchParams.get('f_adv');
  let advanced: FilterGroup = DEFAULT_ADVANCED;
  if (advancedRaw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(advancedRaw));
      if (parsed && parsed.logical && Array.isArray(parsed.items)) {
        advanced = parsed;
      }
    } catch (_) {
      advanced = DEFAULT_ADVANCED;
    }
  }
  return { advanced };
}

function serializeFiltersToSearch(filters: FilterState, searchParams: URLSearchParams) {
  if (filters.advanced?.items?.length) {
    searchParams.set('f_adv', encodeURIComponent(JSON.stringify(filters.advanced)));
  } else {
    searchParams.delete('f_adv');
  }
}

export function GlobalFiltersProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<FilterState>(() => parseFiltersFromSearch(searchParams));

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    serializeFiltersToSearch(filters, next);
    setSearchParams(next, { replace: true });
  }, [filters, searchParams, setSearchParams]);

  const setFilters = useCallback((next: FilterState) => {
    setFiltersState(next);
  }, []);

  const addAdvancedFilter = useCallback((item: Omit<FilterItem, 'id'>) => {
    setFiltersState((prev) => ({
      ...prev,
      advanced: {
        logical: prev.advanced.logical,
        items: [...(prev.advanced.items || []), { ...item, id: crypto.randomUUID() }],
      },
    }));
  }, []);

  const updateAdvancedFilter = useCallback((id: string, patch: Partial<Omit<FilterItem, 'id'>>) => {
    setFiltersState((prev) => ({
      ...prev,
      advanced: {
        logical: prev.advanced.logical,
        items: (prev.advanced.items || []).map((it) => (it.id === id ? { ...it, ...patch } : it)),
      },
    }));
  }, []);

  const removeAdvancedFilter = useCallback((id: string) => {
    setFiltersState((prev) => ({
      ...prev,
      advanced: {
        logical: prev.advanced.logical,
        items: (prev.advanced.items || []).filter((it) => it.id !== id),
      },
    }));
  }, []);

  const setAdvancedLogical = useCallback((logical: FilterGroup['logical']) => {
    setFiltersState((prev) => ({
      ...prev,
      advanced: {
        logical,
        items: prev.advanced.items || [],
      },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const value = useMemo(
    () => ({ filters, setFilters, resetFilters, addAdvancedFilter, updateAdvancedFilter, removeAdvancedFilter, setAdvancedLogical }),
    [filters, resetFilters, setFilters, addAdvancedFilter, updateAdvancedFilter, removeAdvancedFilter, setAdvancedLogical]
  );

  return <GlobalFiltersContext.Provider value={value}>{children}</GlobalFiltersContext.Provider>;
}

export function useGlobalFilters() {
  const ctx = useContext(GlobalFiltersContext);
  if (!ctx) {
    throw new Error('useGlobalFilters must be used within GlobalFiltersProvider');
  }
  return ctx;
}
