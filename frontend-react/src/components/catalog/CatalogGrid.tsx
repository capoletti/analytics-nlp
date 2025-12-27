import { TableCard } from './TableCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface CatalogGridProps {
  tables: string[];
  schema: string;
}

export function CatalogGrid({ tables, schema }: CatalogGridProps) {
  if (tables.length === 0) {
    return (
      <EmptyState
        icon="📭"
        title="Nenhuma tabela disponível"
        description={`O schema ${schema} não contém tabelas no momento`}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tables.map((table) => (
        <TableCard key={table} tableName={table} schema={schema} />
      ))}
    </div>
  );
}
