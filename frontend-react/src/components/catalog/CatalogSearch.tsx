import { Search } from 'lucide-react';

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CatalogSearch({ value, onChange }: CatalogSearchProps) {
  return (
    <div className="card">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar tabelas..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input pl-10"
        />
      </div>
    </div>
  );
}
