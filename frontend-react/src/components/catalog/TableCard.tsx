import { Database, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

interface TableCardProps {
  tableName: string;
  schema: string;
}

export function TableCard({ tableName, schema }: TableCardProps) {
  const { showToast } = useToast();

  const handleExplore = () => {
    showToast(`Explorando tabela: ${tableName}`, 'info');
    // TODO: Implement table exploration
  };

  const handlePreview = () => {
    showToast(`Carregando prévia de: ${tableName}`, 'info');
    // TODO: Implement table preview
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <Database className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{tableName}</h3>
          <p className="mt-1 text-sm text-gray-500">Tabela de dados - {tableName}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Catalog:</span> iceberg
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Schema:</span> {schema}
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
        <Button variant="info" onClick={handleExplore} className="flex-1" size="sm">
          <Search className="h-4 w-4" />
          Explorar
        </Button>
        <Button variant="secondary" onClick={handlePreview} className="flex-1" size="sm">
          <Eye className="h-4 w-4" />
          Prévia
        </Button>
      </div>
    </div>
  );
}
