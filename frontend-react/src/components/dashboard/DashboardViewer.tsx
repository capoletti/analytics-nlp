import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KPICards } from './KPICards';
import { ChartRenderer } from '@/components/charts/ChartRenderer';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/export/ExportButtons';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { applyFilters } from '@/utils/applyFilters';
import type { Dashboard, DashboardData } from '@/types/dashboard';
import type { ChartConfig } from '@/types/chart';
import { mapElementToChartConfig } from '@/utils/mapElementToChartConfig';

interface DashboardViewerProps {
  dashboard: Dashboard;
  data: DashboardData[];
  onBack: () => void;
}

export function DashboardViewer({
  dashboard,
  data,
  onBack,
}: DashboardViewerProps) {
  const { filters } = useGlobalFilters();
  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">{dashboard.name}</h2>
        </div>

        <div className="flex items-center gap-2">
          <ExportButtons data={filteredData} />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6"></div>

      {/* KPIs */}
      <KPICards data={filteredData} />

      {/* Charts */}
      <div className="grid grid-cols-12 gap-6 auto-rows-[120px]">
        {(dashboard.elements || [])
          .map(mapElementToChartConfig)
          .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0) || (a.position?.x ?? 0) - (b.position?.x ?? 0))
          .map((chart: ChartConfig) => (
          <div
            key={chart.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            style={{
              gridColumn: chart.position ? `${Math.max(1, (chart.position.x || 0) + 1)} / span ${Math.min(chart.position.w || 3, 12)}` : undefined,
              gridRow: chart.position ? `${Math.max(1, (chart.position.y || 0) + 1)} / span ${Math.max(chart.position.h || 3, 1)}` : undefined,
              height: '100%',
            }}
          >
            <h3 className="mb-4 font-semibold text-gray-900">{chart.title}</h3>
            <div className="flex-1 min-h-0">
              <ChartRenderer
                type={chart.type}
                data={filteredData}
                title={chart.title}
                height={(chart.position?.h || 3) * 60 - 80}
                customization={chart.customization}
                filters={filters}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable data={filteredData} />
    </div>
  );
}
