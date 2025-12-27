import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Search, SortAsc } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboards } from '@/hooks/useDashboards';
import { DashboardList } from './DashboardList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { NLDashboardGenerator } from './NLDashboardGenerator';

export function DashboardView() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  
  const {
    dashboards,
    isLoading,
    deleteDashboard,
  } = useDashboards(tenant);

  const filteredDashboards = dashboards
    .filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto max-w-7xl px-6 py-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
              </div>
              <p className="text-gray-600">
                {filteredDashboards.length} {filteredDashboards.length === 1 ? 'dashboard' : 'dashboards'} disponível{filteredDashboards.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard/new')} className="flex items-center gap-2 shadow-lg hover:shadow-xl">
              <Plus className="h-5 w-5" />
              Novo Dashboard
            </Button>
          </div>

          {/* Search and Filters */}
          {dashboards.length > 0 && (
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar dashboards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={() => setSortBy(sortBy === 'recent' ? 'name' : 'recent')}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <SortAsc className="h-4 w-4" />
                {sortBy === 'recent' ? 'Recentes' : 'Nome'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6">
            <NLDashboardGenerator />
          </div>
          {filteredDashboards.length === 0 && dashboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <BarChart3 className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Nenhum dashboard criado</h2>
              <p className="mb-6 text-center text-gray-600">
                Crie seu primeiro dashboard para começar a visualizar dados e tomar decisões melhores
              </p>
              <Button onClick={() => navigate('/dashboard/new')} className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Primeiro Dashboard
              </Button>
            </div>
          ) : filteredDashboards.length === 0 ? (
            <div className="text-center">
              <p className="text-gray-500">Nenhum dashboard encontrado com "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-primary hover:underline"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <DashboardList
              dashboards={filteredDashboards}
              onOpen={(id) => navigate(`/dashboard/${id}`)}
              onEdit={(id) => navigate(`/dashboard/edit/${id}`)}
              onDelete={deleteDashboard}
            />
          )}
        </div>
      </div>
    </div>
  );
}
