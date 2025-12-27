export type ChartType = 
  // Séries Temporais
  | 'time-series-line' | 'time-series-bar' | 'time-series-area' | 'time-series-percent'
  // Barras
  | 'bar' | 'bar-horizontal' | 'bar-stacked' | 'bar-grouped'
  // Linhas e Área
  | 'line' | 'area' | 'area-stacked'
  // Circulares
  | 'pie' | 'sunburst' | 'treemap'
  // Dispersão
  | 'scatter' | 'bubble'
  // Tabelas
  | 'table' | 'pivot-table' | 'pivot-heatmap'
  // Indicadores
  | 'kpi' | 'kpi-trendline' | 'gauge' | 'progress-bar'
  // Outros
  | 'sankey' | 'wordcloud' | 'histogram' | 'boxplot' | 'rose';

export interface ChartCustomization {
  primaryColor?: string;
  accentColor?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animationEnabled?: boolean;
  height?: number;
  width?: string;
  dateFormat?: string;
  numberFormat?: string;
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  sql?: string;
  table?: string;
  columns?: string[];
  dimensions?: string[];
  metrics?: Array<{ column: string; aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' }>;
  timeField?: string;
  orderBy?: Array<{ column: string; direction: 'asc' | 'desc' }>;
  xAxis?: string;
  yAxis?: string[];
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
  filters?: Record<string, unknown>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  customization?: ChartCustomization;
}

export interface ChartData {
  [key: string]: unknown;
}
