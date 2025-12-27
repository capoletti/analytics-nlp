import type { FilterGroup, FilterItem, FilterOp, FilterValue } from '@/types/filters';

interface GlobalFilterBuilderProps {
  value: FilterGroup;
  onAdd: (item: Omit<FilterItem, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Omit<FilterItem, 'id'>>) => void;
  onRemove: (id: string) => void;
  onLogicalChange: (logical: FilterGroup['logical']) => void;
  availableFields?: string[];
}

const OPS: { value: FilterOp; label: string }[] = [
  { value: 'eq', label: 'Igual' },
  { value: 'neq', label: 'Diferente' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'in', label: 'Em (lista)' },
  { value: 'not_in', label: 'Fora (lista)' },
  { value: 'between', label: 'Entre' },
  { value: 'contains', label: 'Contém' },
];

export function GlobalFilterBuilder({ value, onAdd, onUpdate, onRemove, onLogicalChange, availableFields = [] }: GlobalFilterBuilderProps) {
  const items = value.items || [];

  const addEmpty = () => {
    onAdd({ field: '', op: 'eq', value: '' });
  };

  const logical = value.logical || 'AND';
  const hasActiveFilters = items.length > 0;

  return (
    <div className={`rounded-lg border-2 p-4 shadow-sm ${hasActiveFilters ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">Filtros globais (avançado)</span>
            {hasActiveFilters && (
              <span className="inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {items.length} ativo{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <div className="flex gap-2 text-xs">
              <button
                className={`rounded-md border px-2 py-1 ${logical === 'AND' ? 'border-blue-600 text-blue-600 font-semibold' : 'text-gray-600'}`}
                onClick={() => onLogicalChange('AND')}
                type="button"
              >
                AND
              </button>
              <button
                className={`rounded-md border px-2 py-1 ${logical === 'OR' ? 'border-blue-600 text-blue-600 font-semibold' : 'text-gray-600'}`}
                onClick={() => onLogicalChange('OR')}
                type="button"
              >
                OR
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={addEmpty}
          className="rounded-md border border-dashed px-3 py-1 text-sm text-gray-700 hover:border-blue-600 hover:text-blue-600"
        >
          + Adicionar filtro
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum filtro avançado. Adicione um para começar.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 rounded-md border border-blue-200 bg-white p-3">
              <select
                className="col-span-4 rounded-md border border-gray-300 px-2 py-1 text-sm"
                value={item.field}
                onChange={(e) => onUpdate(item.id, { field: e.target.value })}
              >
                <option value="">-- Selecione o campo --</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              <select
                className="col-span-2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                value={item.op}
                onChange={(e) => onUpdate(item.id, { op: e.target.value as FilterOp })}
              >
                {OPS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              <input
                className="col-span-5 rounded-md border border-gray-300 px-2 py-1 text-sm"
                placeholder="Valor (lista: v1,v2)"
                value={valueToInput(item.value)}
                onChange={(e) => onUpdate(item.id, { value: inputToValue(e.target.value, item.op) })}
              />
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="col-span-1 rounded-md border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function valueToInput(v: FilterItem['value']): string {
  if (Array.isArray(v)) return v.join(',');
  return v?.toString() ?? '';
}

function inputToValue(raw: string, op: FilterOp): FilterValue {
  if (op === 'in' || op === 'not_in') {
    return raw.split(',').map((x) => x.trim()).filter(Boolean);
  }
  if (op === 'between') {
    const parts = raw.split(',').map((x) => x.trim()).filter(Boolean);
    return parts.slice(0, 2);
  }
  // Try to parse as number
  const asNumber = Number(raw);
  if (!isNaN(asNumber) && raw.trim() !== '') {
    return asNumber;
  }
  return raw;
}
