import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Layout } from 'react-grid-layout';
import { ChartConfig } from '@/types/chart';
import { mapElementToChartConfig } from '@/utils/mapElementToChartConfig';
import { ChartEditor } from '@/components/charts/ChartEditor';
import { Button } from '@/components/ui/Button';
import { Plus, Save, ArrowLeft, Sparkles, Eye, EyeOff, Settings, Layout as LayoutIcon, Trash2, Pencil } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/ToastProvider';
import { dashboardService } from '@/services/dashboardService';
import { chartDataService } from '@/services/chartDataService';
import { useAuth } from '@/contexts/AuthContext';
import { InteractiveDashboardGrid } from '@/components/dashboard/InteractiveDashboardGrid';
// Removed unused Dashboard type

export function DashboardEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { tenant } = useAuth();
  
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  // Load dashboard if editing
  useEffect(() => {
    const loadDashboard = async () => {
      if (!id || !tenant) return;
      
      try {
        setIsLoading(true);
        const dashboard = await dashboardService.getById(tenant, id);
        setDashboardName(dashboard.name);
        setDashboardDescription(dashboard.description || '');
        setCharts((dashboard.elements || []).map(mapElementToChartConfig));
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showToast('Erro ao carregar dashboard', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [id, tenant, showToast, navigate]);

  // Initialize name/description when creating via "Criar e Editar"
  useEffect(() => {
    if (!id && location.state && typeof (location.state as any).name === 'string') {
      const s = location.state as { name?: string; description?: string };
      setDashboardName(s.name || '');
      setDashboardDescription(s.description || '');
    }
  }, [id, location.state]);

  // Load available tables from Trino
  useEffect(() => {
    const loadTables = async () => {
      if (!tenant) return;
      
      try {
        const tables = await chartDataService.getTables(tenant);
        setAvailableTables(tables);
      } catch (error) {
        console.error('Erro ao carregar tabelas:', error);
        // Fallback to empty array if tables can't be loaded
        setAvailableTables([]);
      }
    };

    loadTables();
  }, [tenant]);

  const handleAddChart = () => {
    setEditingChart(null);
    setIsEditorOpen(true);
  };

  const handleEditChart = (chartId: string) => {
    const chart = charts.find((c) => c.id === chartId);
    if (chart) {
      setEditingChart(chart);
      setIsEditorOpen(true);
    }
  };

  const handleDeleteChart = (chartId: string) => {
    setDeleteConfirmId(chartId);
  };

  const confirmDeleteChart = (chartId: string) => {
    setCharts(charts.filter((c) => c.id !== chartId));
    setDeleteConfirmId(null);
    showToast('Gráfico excluído com sucesso', 'success');
  };

  const handleSaveChart = (chart: ChartConfig) => {
    if (editingChart) {
      // Update existing chart
      setCharts(charts.map((c) => (c.id === chart.id ? chart : c)));
      showToast('Gráfico atualizado', 'success');
    } else {
      // Add new chart
      const newChart = {
        ...chart,
        id: `chart-${Date.now()}`,
        position: chart.position || { x: 0, y: 0, w: 1, h: 3 },
      };
      setCharts([...charts, newChart]);
      showToast('Gráfico adicionado', 'success');
    }
    setIsEditorOpen(false);
    setEditingChart(null);
  };

  const handleSaveDashboard = async () => {
    if (!dashboardName.trim()) {
      showToast('Digite um nome para o dashboard', 'error');
      return;
    }

    if (charts.length === 0) {
      showToast('Adicione pelo menos um gráfico', 'error');
      return;
    }

    if (!tenant) {
      showToast('Tenant não encontrado', 'error');
      return;
    }

    // Map frontend chart configs to backend DashboardElementDTO shape
    const toElementDTO = (c: ChartConfig) => {
      const fallbackName = (c.title || c.table || c.type || 'Gráfico').toString().trim() || 'Gráfico';
      const isTable = c.type === 'table' || c.type === 'pivot-table' || c.type === 'pivot-heatmap';
      const isKpi = c.type === 'kpi' || c.type === 'kpi-trendline' || c.type === 'gauge' || c.type === 'progress-bar';
      const kind = isTable ? 'table' : isKpi ? 'kpi' : 'chart';
      return {
        id: c.id,
        name: fallbackName,
        type: kind,
        config: {
          type: c.type,
          position: c.position,
          customization: c.customization,
          table: c.table,
          columns: c.columns,
          dimensions: c.dimensions,
          metrics: c.metrics,
          timeField: c.timeField,
          orderBy: c.orderBy,
          xAxis: c.xAxis,
          yAxis: c.yAxis,
          aggregation: c.aggregation,
          filters: c.filters,
        },
        sql: c.sql || undefined,
      };
    };

    try {
      setIsSaving(true);
      
      if (id) {
        // Update existing dashboard
        await dashboardService.update(tenant, id, {
          name: dashboardName,
          description: dashboardDescription.trim() || undefined,
          elements: charts.map(toElementDTO) as any,
        });
        showToast('Dashboard atualizado com sucesso!', 'success');
        navigate(`/dashboard/${id}`);
      } else {
        // Create new dashboard
        const newDashboard = await dashboardService.create(tenant, {
          name: dashboardName,
          description: dashboardDescription.trim() || undefined,
          elements: charts.map(toElementDTO) as any,
        });
        showToast('Dashboard criado com sucesso!', 'success');
        navigate(`/dashboard/${newDashboard.id}`);
      }
    } catch (error) {
      console.error('Erro ao salvar dashboard:', error);
      showToast(
        error instanceof Error
          ? error.message
          : id
            ? 'Erro ao atualizar dashboard'
            : 'Erro ao criar dashboard',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl">⏳</div>
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {id ? 'Editar Dashboard' : 'Novo Dashboard'}
              </h1>
              <p className="text-sm text-gray-500">
                {charts.length} {charts.length === 1 ? 'gráfico' : 'gráficos'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isPreviewMode && (
            <button
              onClick={() => setShowMetadataPanel(!showMetadataPanel)}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              <Settings className="h-4 w-4" />
              {showMetadataPanel ? 'Ocultar' : 'Mostrar'} Configurações
            </button>
          )}
          
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isPreviewMode
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                Modo Edição
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Visualizar
              </>
            )}
          </button>
          
          <Button
            onClick={handleSaveDashboard}
            disabled={isSaving || !dashboardName.trim() || charts.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Metadata Panel */}
        {!isPreviewMode && showMetadataPanel && (
          <div className="w-80 border-r border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Settings className="h-5 w-5" />
                Configurações
              </h2>
            </div>

            <div className="space-y-6">
              {/* Dashboard Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nome do Dashboard *
                </label>
                <input
                  type="text"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="Ex: Vendas Q4 2024"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  maxLength={255}
                />
                <p className="mt-1.5 text-xs text-gray-500">{dashboardName.length}/255</p>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  value={dashboardDescription}
                  onChange={(e) => setDashboardDescription(e.target.value)}
                  placeholder="Adicione uma descrição para este dashboard..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={4}
                  maxLength={1000}
                />
                <p className="mt-1.5 text-xs text-gray-500">{dashboardDescription.length}/1000</p>
              </div>

              {/* Charts List */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Gráficos</h3>
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                    {charts.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {charts.map((chart, index) => (
                    <div
                      key={chart.id}
                      className={`group flex items-center justify-between rounded-lg border p-3 transition-all cursor-pointer ${
                        selectedChartId === chart.id
                          ? 'border-primary bg-primary-light'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedChartId(chart.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
                          selectedChartId === chart.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{chart.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{chart.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton ariaLabel="Editar" size="sm" onClick={() => handleEditChart(chart.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton ariaLabel="Excluir" size="sm" onClick={() => handleDeleteChart(chart.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddChart}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Gráfico
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center Canvas - Dashboard Preview */}
        <div className="flex-1 overflow-auto p-6">
          {charts.length > 0 ? (
            <InteractiveDashboardGrid
              charts={charts}
              tenant={tenant || ''}
              isEditing={!isPreviewMode}
              onEditChart={handleEditChart}
              onLayoutChange={(newLayout: Layout) => {
                setCharts(charts.map(chart => {
                  const layoutItem = newLayout.find(l => l.i === chart.id);
                  if (!layoutItem) return chart;
                  
                  return {
                    ...chart,
                    position: {
                      x: layoutItem.x || 0,
                      y: layoutItem.y || 0,
                      w: layoutItem.w || 2,
                      h: layoutItem.h || 3,
                    }
                  };
                }));
                // (revert) no toast or auto-save on layout change
              }}
              onDeleteChart={handleDeleteChart}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                  <LayoutIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Dashboard vazio
                </h3>
                <p className="mb-6 text-gray-500">
                  Adicione seu primeiro gráfico para começar
                </p>
                <Button onClick={handleAddChart} className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Criar Primeiro Gráfico
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Dialog for Chart Deletion */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-sm rounded-xl border border-red-200 bg-white shadow-2xl">
            <div className="border-b border-red-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Excluir Gráfico?</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Esta ação não pode ser desfeita. O gráfico será removido do dashboard permanentemente.
              </p>
            </div>
            <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDeleteChart(deleteConfirmId)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Chart Editor Sidebar - Fixed positioning */}
      {isEditorOpen && (
        <ChartEditor
          chart={editingChart || undefined}
          availableTables={availableTables}
          tenant={tenant}
          onSave={handleSaveChart}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingChart(null);
          }}
        />
      )}

    </div>
  );
}
