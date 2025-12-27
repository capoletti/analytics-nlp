import { usePagination } from '@/hooks/usePagination';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Pagination } from './Pagination';
import type { DashboardData } from '@/types/dashboard';

interface DataTableProps {
  data: DashboardData[];
}

export function DataTable({ data }: DataTableProps) {
  const { items, currentPage, totalPages, nextPage, previousPage, hasNext, hasPrevious } =
    usePagination(data, { pageSize: 20 });

  return (
    <div className="card">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Detalhamento de Pedidos</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Categoria</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Região</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Canal</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.data)}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.cliente}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.categoria}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.regiao}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.canal}</td>
                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(item.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={nextPage}
        onPrevious={previousPage}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
      />
    </div>
  );
}
