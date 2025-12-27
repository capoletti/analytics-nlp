import { api } from './api';
import type { ChartConfig, ChartType } from '@/types/chart';

export interface GeneratedDashboard {
  name: string;
  description?: string;
  elements: Array<{
    id: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
    sql?: string | null;
  }>;
  filters?: Record<string, unknown>;
}

export async function generateDashboardFromPrompt(tenant: string, prompt: string): Promise<GeneratedDashboard> {
  const response = await api.post<GeneratedDashboard>('/api/llm/generate-dashboard', {
    tenant,
    prompt,
  });
  return response.data;
}

export function mapGeneratedToChartConfig(elements: GeneratedDashboard['elements']): ChartConfig[] {
  const allowed: ChartType[] = [
    'time-series-line','time-series-bar','time-series-area','time-series-percent',
    'bar','bar-horizontal','bar-stacked','bar-grouped',
    'line','area','area-stacked',
    'pie','sunburst','treemap',
    'scatter','bubble',
    'table','pivot-table','pivot-heatmap',
    'kpi','kpi-trendline','gauge','progress-bar',
    'sankey','wordcloud','histogram','boxplot','rose'
  ];

  return elements.map((elem, index) => {
    const cfg = (elem.config || {}) as Record<string, any>;
    const candidate = (cfg.type as ChartType) || 'bar';
    const chartType: ChartType = allowed.includes(candidate) ? candidate : 'bar';
    return {
      id: elem.id,
      type: chartType,
      title: elem.name || cfg.title || 'Visualização',
      sql: elem.sql || undefined,
      table: cfg.table as string | undefined,
      columns: cfg.columns as string[] | undefined,
      dimensions: cfg.dimensions as string[] | undefined,
      metrics: cfg.metrics as any,
      timeField: cfg.timeField as string | undefined,
      orderBy: cfg.orderBy as any,
      xAxis: (cfg.xAxis as string) || (cfg.dimension as string) || undefined,
      yAxis: (cfg.yAxis as string[]) || (cfg.metrics as string[]) || undefined,
      aggregation: cfg.aggregation as any,
      filters: (cfg.filters as Record<string, unknown>) || {},
      position: (cfg.position as any) || { x: 0, y: index * 3, w: 4, h: 3 },
      customization: cfg.customization as any,
    };
  });
}
