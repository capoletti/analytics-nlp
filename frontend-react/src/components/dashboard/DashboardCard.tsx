import { Calendar, Edit2, Trash2, ChevronRight, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/utils/formatters';
import type { Dashboard } from '@/types/dashboard';

interface DashboardCardProps {
  dashboard: Dashboard;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DashboardCard({ dashboard, onOpen, onEdit, onDelete }: DashboardCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const chartCount = dashboard.elements?.length || 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-primary hover:shadow-lg"
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

      {/* Content */}
      <div className="relative flex flex-col p-6 h-full">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 cursor-pointer" onClick={() => onOpen(dashboard.id)}>
            <h3 className="mb-1 line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {dashboard.name}
            </h3>
            <p className="line-clamp-2 text-sm text-gray-600">
              {dashboard.description || 'Sem descrição'}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-lg border border-gray-200 bg-white shadow-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(dashboard.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Tem certeza que deseja excluir este dashboard?')) {
                      onDelete(dashboard.id);
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-4 space-y-2 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(dashboard.created_at)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span className="text-gray-600">
              {chartCount} {chartCount === 1 ? 'gráfico' : 'gráficos'}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <button
            onClick={() => onOpen(dashboard.id)}
            className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-md group-hover:shadow-lg"
          >
            <span>Abrir Dashboard</span>
            <ChevronRight className={`h-4 w-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
