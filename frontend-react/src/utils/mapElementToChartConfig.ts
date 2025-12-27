import type { ChartConfig } from '@/types/chart';

export function mapElementToChartConfig(elem: any): ChartConfig {
  return {
    id: elem?.id,
    type: elem?.config?.type || 'bar',
    title: (elem?.name || '').toString(),
    sql: elem?.sql,
    table: elem?.config?.table,
    columns: elem?.config?.columns,
    dimensions: elem?.config?.dimensions,
    metrics: elem?.config?.metrics,
    timeField: elem?.config?.timeField,
    orderBy: elem?.config?.orderBy,
    xAxis: elem?.config?.xAxis,
    yAxis: elem?.config?.yAxis,
    aggregation: elem?.config?.aggregation,
    filters: elem?.config?.filters,
    position: elem?.config?.position || { x: 0, y: 0, w: 2, h: 3 },
    customization: elem?.config?.customization,
  };
}
