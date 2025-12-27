import { useState, useCallback, useMemo } from 'react';
import type { DashboardData } from '@/types/dashboard';
import type { FilterState } from '@/types/filters';

const DEFAULT_FILTERS: FilterState = {
  advanced: { logical: 'AND', items: [] },
};

export function useFilters(data: DashboardData[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filteredData = useMemo(() => {
    return [...data];
  }, [data]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredData,
  };
}
