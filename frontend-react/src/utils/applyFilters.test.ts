import { describe, expect, it } from 'vitest';
import { applyFilters } from './applyFilters';
import type { FilterState } from '@/types/filters';

describe('applyFilters', () => {
  it('returns all data when no filters are applied', () => {
    const filters: FilterState = { advanced: { logical: 'AND', items: [] } };
    const data = [
      { id: 1, categoria: 'A', valor: 10 },
      { id: 2, categoria: 'B', valor: 20 },
    ];

    const result = applyFilters(data, filters);

    expect(result).toHaveLength(2);
  });

  it('applies advanced contains filter on client', () => {
    const filters: FilterState = {
      advanced: { logical: 'AND', items: [{ id: '1', field: 'status', op: 'contains', value: 'PA' }] },
    };
    const data = [
      { data: '2025-01-10', status: 'PAGO', valor: 10 },
      { data: '2025-01-11', status: 'ABERTO', valor: 3 },
      { data: '2025-01-12', status: 'VENCIDO', valor: 5 },
    ];

    const result = applyFilters(data, filters);

    expect(result.map((r) => (r as any).status)).toEqual(['PAGO']);
  });
});
