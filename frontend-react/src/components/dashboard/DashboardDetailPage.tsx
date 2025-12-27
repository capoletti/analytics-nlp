import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChartConfig } from '@/types/chart';
import { mapElementToChartConfig } from '@/utils/mapElementToChartConfig';
import { ChartRendererEnhanced } from '@/components/charts/ChartRendererEnhanced';
import { Button } from '@/components/ui/Button';
import { Share2, Download, RefreshCw, Pencil } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/ToastProvider';
import { dashboardService } from '@/services/dashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { useHeader } from '@/contexts/HeaderContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { GlobalFilterBuilder } from '@/components/filters/GlobalFilterBuilder';
import type { Dashboard } from '@/types/dashboard';
import type { FilterState } from '@/types/filters';

export function DashboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { tenant } = useAuth();
  const { setTitle, setActions } = useHeader();
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { filters, addAdvancedFilter, updateAdvancedFilter, removeAdvancedFilter, setAdvancedLogical } = useGlobalFilters();

  useEffect(() => {
    const loadDashboard = async () => {
      if (!tenant || !id) {
        showToast('Parâmetros inválidos', 'error');
        navigate('/dashboard');
        return;
      }

      try {
        setIsLoading(true);
        const data = await dashboardService.getById(tenant, id);
        setDashboard(data);
        
        // Set header title and actions
        setTitle(data.name);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showToast('Erro ao carregar dashboard', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();

    // Cleanup: remove title when unmounting
    return () => setTitle(undefined);
  }, [id, tenant, showToast, navigate, setTitle]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Dados atualizados com sucesso', 'success');
    }, 1000);
  }, [showToast]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast('Link copiado para a área de transferência', 'success');
  }, [showToast]);

  const handleExport = useCallback(() => {
    showToast('Exportação em desenvolvimento', 'info');
  }, [showToast]);

  // Extract charts and available fields
  const charts = useMemo(() => {
    if (!dashboard) return [];
    return (dashboard.elements || []).map(mapElementToChartConfig) as ChartConfig[];
  }, [dashboard]);

  const availableFields = useMemo(() => {
    const fieldsSet = new Set<string>();
    charts.forEach((chart) => {
      // Add dimensions
      chart.dimensions?.forEach((dim) => fieldsSet.add(dim));
      // Add metrics columns
      chart.metrics?.forEach((metric) => fieldsSet.add(metric.column));
      // Add columns
      chart.columns?.forEach((col) => fieldsSet.add(col));
      // Add xAxis and yAxis
      if (chart.xAxis) fieldsSet.add(chart.xAxis);
      chart.yAxis?.forEach((axis) => fieldsSet.add(axis));
    });
    return Array.from(fieldsSet).sort();
  }, [charts]);

  // Set header actions
  useEffect(() => {
    const actions = (
      <>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          title="Atualizar dados"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          title="Compartilhar dashboard"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          title="Exportar dados"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </>
    );
    setActions(actions);

    return () => setActions(undefined);
  }, [isRefreshing, handleRefresh, handleShare, handleExport, setActions]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="h-12 w-12 rounded-full border-4 border-primary-light border-t-primary animate-spin"></div>
          </div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mb-4 text-4xl">❌</div>
          <p className="mb-4 text-lg font-semibold text-gray-900">Dashboard não encontrado</p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar para Dashboards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6">
            <GlobalFilterBuilder
              value={filters.advanced}
              onAdd={addAdvancedFilter}
              onUpdate={updateAdvancedFilter}
              onRemove={removeAdvancedFilter}
              onLogicalChange={setAdvancedLogical}
              availableFields={availableFields}
            />
          </div>
          {charts.length > 0 ? (
            <div className="grid grid-cols-12 gap-6" style={{ gridAutoRows: '120px' }}>
              {charts
                .slice()
                .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0) || (a.position?.x ?? 0) - (b.position?.x ?? 0))
                .map((chart) => (
                <ChartCard key={chart.id} chart={chart} tenant={tenant || undefined} filters={filters} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="mb-4 text-gray-600">Este dashboard não possui gráficos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ chart, tenant, filters }: { chart: ChartConfig; tenant?: string; filters: FilterState }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(200);

  useEffect(() => {
    const measure = () => {
      if (!contentRef.current) return;
      
      // Measure the actual content area height, excluding padding
      const styles = getComputedStyle(contentRef.current);
      const pt = parseFloat(styles.paddingTop) || 0;
      const pb = parseFloat(styles.paddingBottom) || 0;
      const available = Math.floor(contentRef.current.clientHeight - pt - pb);
      console.debug('[ChartCard] measure', {
        clientHeight: contentRef.current.clientHeight,
        pt,
        pb,
        available,
      });
      
      setHeight(Math.max(160, available));
    };

    // Initial measure with small delay to ensure layout is complete
    const timer = setTimeout(measure, 50);
    
    const ro = new ResizeObserver(() => measure());
    if (cardRef.current) ro.observe(cardRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-md overflow-hidden"
      style={{
        gridColumn: chart.position ? `${Math.max(1, (chart.position.x || 0) + 1)} / span ${Math.min(chart.position.w || 3, 12)}` : undefined,
        gridRow: chart.position ? `${Math.max(1, (chart.position.y || 0) + 1)} / span ${Math.max(chart.position.h || 3, 1)}` : undefined,
      }}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 bg-white flex-shrink-0">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800">{chart.title}</h3>
          <p className="text-xs text-gray-500 capitalize">{chart.type}</p>
        </div>
        <IconButton
          ariaLabel="Editar gráfico"
          size="sm"
          variant="outline"
          onClick={() => navigate(`/dashboard/edit/${id}`)}
        >
          <Pencil className="h-4 w-4" />
        </IconButton>
      </div>

      <div ref={contentRef} className="flex-1 min-h-0 w-full min-w-0 bg-white">
        <ChartRendererEnhanced
          type={chart.type}
          title={chart.title}
          height={height}
          tenant={tenant}
          table={chart.table}
          sql={chart.sql}
          customization={chart.customization}
          filters={filters}
          xKey={chart.xAxis}
          yKeys={chart.yAxis}
          dimensions={chart.dimensions}
          metrics={chart.metrics}
        />
      </div>
    </div>
  );
}
