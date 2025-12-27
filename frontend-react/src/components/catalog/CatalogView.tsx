import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalogService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CatalogGrid } from './CatalogGrid';
import { CatalogSearch } from './CatalogSearch';

export function CatalogView() {
  const { tenant } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['catalog', tenant],
    queryFn: () => catalogService.getTables(tenant!),
    enabled: !!tenant,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Erro ao carregar catálogo"
        description="Não foi possível conectar ao Trino. Verifique a conexão e tente novamente."
        action={{
          label: 'Tentar Novamente',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  const tables = data?.tables || [];
  const schema = data?.schema || tenant;
  const filteredTables = searchQuery
    ? tables.filter((table) => table.toLowerCase().includes(searchQuery.toLowerCase()))
    : tables;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tabelas Disponíveis</h2>
          <p className="mt-1 text-sm text-gray-500">
            Schema: <span className="font-medium text-gray-900">{schema}</span> • Total:{' '}
            <span className="font-medium text-gray-900">{tables.length}</span> tabelas
          </p>
        </div>
        <div className="rounded-lg bg-info/10 px-4 py-2 text-sm font-medium text-info">
          Catalog: iceberg
        </div>
      </div>

      <CatalogSearch value={searchQuery} onChange={setSearchQuery} />

      {filteredTables.length === 0 && searchQuery ? (
        <EmptyState
          icon="📭"
          title="Nenhuma tabela encontrada"
          description="Tente outro termo de busca"
        />
      ) : (
        <CatalogGrid tables={filteredTables} schema={schema!} />
      )}
    </div>
  );
}
