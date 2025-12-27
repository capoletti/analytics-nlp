import type { ChartData } from '@/types/chart';
import type { FilterState, FilterItem } from '@/types/filters';

export function applyFilters<T extends ChartData>(data: T[], filters?: FilterState): T[] {
  if (!filters) return data;

  let result = [...data];

  // Apply advanced filters on the client (fallback when backend cannot apply)
  if (filters.advanced?.items?.length) {
    result = result.filter((row) => evalAdvanced(filters.advanced.items, filters.advanced.logical || 'AND', row));
  }

  return result;
}

function evalAdvanced(items: FilterItem[], logical: 'AND' | 'OR', row: ChartData) {
  const checks = items.map((item) => matchCondition(row, item));
  return logical === 'AND' ? checks.every(Boolean) : checks.some(Boolean);
}

function matchCondition(row: ChartData, item: FilterItem): boolean {
  const value = (row as any)[item.field];
  const op = item.op;
  const target = item.value as any;

  if (value == null) return false;

  switch (op) {
    case 'eq':
      return value == target;
    case 'neq':
      return value != target;
    case 'gt':
      return Number(value) > Number(target);
    case 'gte':
      return Number(value) >= Number(target);
    case 'lt':
      return Number(value) < Number(target);
    case 'lte':
      return Number(value) <= Number(target);
    case 'in':
      return Array.isArray(target) ? target.includes(value) : value == target;
    case 'not_in':
      return Array.isArray(target) ? !target.includes(value) : value != target;
    case 'between':
      if (Array.isArray(target) && target.length === 2) {
        const [a, b] = target.map((v) => Number(v));
        const n = Number(value);
        return n >= Math.min(a, b) && n <= Math.max(a, b);
      }
      return true;
    case 'contains':
      return String(value).toLowerCase().includes(String(target ?? '').toLowerCase());
    default:
      return true;
  }
}
