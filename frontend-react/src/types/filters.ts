export type Period = 'all' | '30' | '60' | '90';
export type SegmentKey = 'categoria' | 'regiao' | 'canal';
export type GroupBy = 'dia' | 'mes';

export type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'between' | 'contains';
export type FilterValue = string | number | Array<string | number>;

export interface FilterItem {
  id: string;
  field: string;
  op: FilterOp;
  value: FilterValue;
}

export interface FilterGroup {
  logical: 'AND' | 'OR';
  items: FilterItem[];
}

export interface FilterState {
  advanced: FilterGroup;
}
