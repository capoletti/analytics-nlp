import { ReactNode } from 'react';
import { ChartConfig } from '@/types/chart';
import { Pencil, Trash2, GripVertical } from 'lucide-react';

interface ChartGridProps {
  charts: ChartConfig[];
  onEditChart: (chartId: string) => void;
  onDeleteChart: (chartId: string) => void;
  onPositionChange?: (chartId: string, position: { x: number; y: number; w: number; h: number }) => void;
  children?: (chart: ChartConfig) => ReactNode;
}

export function ChartGrid({ charts, onEditChart, onDeleteChart, children }: ChartGridProps) {
  // Simple grid layout without drag-and-drop for now
  // We can add react-grid-layout later if needed
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {charts.map((chart) => (
        <div
          key={chart.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          style={{
            gridColumn: chart.position ? `span ${Math.min(chart.position.w, 3)}` : undefined,
            minHeight: chart.position ? `${chart.position.h * 100}px` : '300px',
          }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900">{chart.title}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEditChart(chart.id)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Editar gráfico"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteChart(chart.id)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                title="Excluir gráfico"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chart Content */}
          <div className="h-full">
            {children?.(chart)}
          </div>
        </div>
      ))}
    </div>
  );
}
