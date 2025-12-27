import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter } from 'recharts';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { ChartType, ChartData, ChartCustomization } from '@/types/chart';
import type { FilterState } from '@/types/filters';
import { applyFilters } from '@/utils/applyFilters';
import { chartDataService } from '@/services/chartDataService';
import { ChartSkeleton } from './ChartSkeleton';

interface ChartRendererProps {
  type: ChartType;
  data?: ChartData[]; // Optional if loading from backend
  title: string;
  height?: number;
  isLoading?: boolean;
  error?: string | null;
  customization?: ChartCustomization;
  filters?: FilterState;
  
  // Backend loading options
  tenant?: string;
  table?: string;
  sql?: string;
  onDataLoaded?: (data: ChartData[]) => void;
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7c7c', '#a4de6c'];

export function ChartRenderer({ 
  type, 
  data: initialData,
  title, 
  height = 300,
  isLoading: initialLoading = false,
  error: initialError = null,
  customization,
  filters,
  tenant,
  table,
  sql,
  onDataLoaded,
}: ChartRendererProps) {
  const [rawData, setRawData] = useState<ChartData[]>(initialData || []);
  const data = useMemo(() => applyFilters(rawData, filters), [filters, rawData]);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  // Load data from backend if table or sql is provided
  useEffect(() => {
    if (!tenant || (!table && !sql)) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Only send filters if using table (not custom SQL) and filters exist
        const shouldSendFilters = table && !sql && filters?.advanced?.items?.length;
        
        const response = await chartDataService.getChartData(tenant, {
          table,
          sql,
          limit: 1000,
          offset: 0,
          filters: shouldSendFilters ? filters.advanced : undefined,
        });

        setRawData(response.data);
        onDataLoaded?.(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
        setRawData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [tenant, table, sql, filters?.advanced, onDataLoaded]);
  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg bg-red-50 p-6 text-center">
        <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
        <p className="text-sm font-medium text-red-900">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <TrendingUp className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">Sem dados disponíveis</p>
      </div>
    );
  }

  const colors = customization?.primaryColor 
    ? [customization.primaryColor, customization.accentColor || '#00C49F', ...DEFAULT_COLORS]
    : DEFAULT_COLORS;
  
  const keys = Object.keys(data[0] || {});
  const xKey = keys[0];
  const yKeys = keys.slice(1);
  const h = customization?.height || height;

  // Tabela
  if (type === 'table' || type === 'pivot-table' || type === 'pivot-heatmap') {
    return (
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {keys.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.slice(0, 50).map((row, idx) => (
              <tr key={idx} className={`hover:bg-gray-50 transition-colors ${
                type === 'pivot-heatmap' ? 'bg-opacity-50' : ''
              }`}>
                {keys.map((key, colIdx) => {
                  let bgColor = '';
                  if (type === 'pivot-heatmap' && colIdx > 0) {
                    const val = parseFloat(String(row[key])) || 0;
                    const max = Math.max(...data.map(d => parseFloat(String(d[key])) || 0));
                    const intensity = max > 0 ? val / max : 0;
                    const opacity = Math.floor(intensity * 100);
                    bgColor = `rgba(0, 136, 254, 0.${Math.max(10, opacity)})`;
                  }
                  return (
                    <td 
                      key={key} 
                      className="whitespace-nowrap px-4 py-2 text-sm text-gray-900"
                      style={{ backgroundColor: bgColor }}
                    >
                      {String(row[key])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // KPI / Big Number
  if (type === 'kpi' || type === 'kpi-trendline') {
    const raw = data[0]?.[keys[0]];
    const rawSecond = data.length > 1 ? data[1]?.[keys[0]] : null;
    const value = typeof raw === 'number' ? raw : parseFloat(String(raw ?? 0)) || 0;
    const secondValue = typeof rawSecond === 'number' ? rawSecond : rawSecond != null ? (parseFloat(String(rawSecond)) || 0) : null;
    const change = typeof secondValue === 'number' && secondValue !== 0 ? ((value - secondValue) / secondValue * 100) : null;
    
    return (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <div className={`text-6xl font-bold`} style={{ color: customization?.primaryColor || '#0088FE' }}>
          {value.toLocaleString()}
        </div>
        {change !== null && (
          <div className={`mt-2 text-lg font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600">{title}</div>
      </div>
    );
  }

  // Gauge
  if (type === 'gauge') {
    const value = parseFloat(String(data[0]?.[keys[0]])) || 0;
    const max = 100;
    const percentage = Math.min((value / max) * 100, 100);
    
    return (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 200 100" className="h-full w-full">
            <path
              d="M 20 80 A 60 60 0 0 1 180 80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 20 80 A 60 60 0 0 1 180 80"
              fill="none"
              stroke={customization?.primaryColor || '#0088FE'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(180 * percentage) / 100} 180`}
            />
          </svg>
        </div>
        <div className="mt-4 text-center">
          <div className="text-4xl font-bold" style={{ color: customization?.primaryColor || '#0088FE' }}>
            {value.toFixed(1)}%
          </div>
          <div className="mt-2 text-sm text-gray-600">{title}</div>
        </div>
      </div>
    );
  }

  // Progress Bar
  if (type === 'progress-bar') {
    const value = parseFloat(String(data[0]?.[keys[0]])) || 0;
    const max = 100;
    const percentage = Math.min((value / max) * 100, 100);
    
    return (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <div className="w-full max-w-sm">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
            <span>Progresso</span>
            <span className="font-semibold">{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: customization?.primaryColor || '#0088FE',
              }}
            />
          </div>
          <div className="mt-4 text-center text-2xl font-bold" style={{ color: customization?.primaryColor || '#0088FE' }}>
            {value.toFixed(1)}
          </div>
        </div>
      </div>
    );
  }

  // Barras Verticais
  if (type === 'bar' || type === 'time-series-bar') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data}>
          {customization?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey={xKey} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
          {yKeys.map((key, idx) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={colors[idx % colors.length]} 
              radius={[8, 8, 0, 0]}
              isAnimationActive={customization?.animationEnabled !== false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Barras Horizontais
  if (type === 'bar-horizontal') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical">
          {customization?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis type="number" stroke="#9ca3af" />
          <YAxis dataKey={xKey} type="category" width={100} stroke="#9ca3af" />
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
          {yKeys.map((key, idx) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={colors[idx % colors.length]}
              radius={[0, 8, 8, 0]}
              isAnimationActive={customization?.animationEnabled !== false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Barras Empilhadas
  if (type === 'bar-stacked') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data}>
          {customization?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey={xKey} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
          {yKeys.map((key, idx) => (
            <Bar 
              key={key} 
              dataKey={key} 
              stackId="stack"
              fill={colors[idx % colors.length]}
              isAnimationActive={customization?.animationEnabled !== false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Barras Agrupadas (usando ComposedChart)
  if (type === 'bar-grouped') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data}>
          {customization?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey={xKey} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
          {yKeys.map((key, idx) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={colors[idx % colors.length]}
              radius={[8, 8, 0, 0]}
              isAnimationActive={customization?.animationEnabled !== false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Linhas simples
  if (type === 'line' || type === 'time-series-line') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data}>
          {customization?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey={xKey} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
          {yKeys.map((key, idx) => (
            <Line 
              key={key} 
              type="monotone" 
              dataKey={key} 
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[idx % colors.length], r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={customization?.animationEnabled !== false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Área
  if (type === 'area' || type === 'time-series-area') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={data}>
          <defs>
            {yKeys.map((key, idx) => (
              <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {customization?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey={xKey} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
          {yKeys.map((key, idx) => (
            <Area 
              key={key} 
              type="monotone" 
              dataKey={key} 
              fill={`url(#color${key})`}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              isAnimationActive={customization?.animationEnabled !== false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Área Empilhada
  if (type === 'area-stacked') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={data}>
          <defs>
            {yKeys.map((key, idx) => (
              <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.5} />
                <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {customization?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey={xKey} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
          {yKeys.map((key, idx) => (
            <Area 
              key={key} 
              type="monotone" 
              dataKey={key} 
              fill={`url(#color${key})`}
              stroke={colors[idx % colors.length]}
              stackId="stack"
              strokeWidth={2}
              isAnimationActive={customization?.animationEnabled !== false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Pizza
  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <PieChart>
          <Pie
            data={data}
            dataKey={yKeys[0]}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
            isAnimationActive={customization?.animationEnabled !== false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Dispersão / Scatter
  if (type === 'scatter' || type === 'bubble') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          {customization?.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey={xKey} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          {customization?.showTooltip !== false && <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />}
          {customization?.showLegend !== false && <Legend />}
          {yKeys.map((key, idx) => (
            <Scatter 
              key={key} 
              name={key} 
              data={data} 
              dataKey={key}
              fill={colors[idx % colors.length]}
              isAnimationActive={customization?.animationEnabled !== false}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  // Placeholder para outros tipos (Sankey, Sunburst, Treemap, WordCloud, etc)
  if (['sunburst', 'treemap', 'sankey', 'wordcloud', 'histogram', 'boxplot', 'rose', 'time-series-percent'].includes(type)) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg bg-blue-50 p-6 text-center">
        <TrendingUp className="mb-2 h-8 w-8 text-blue-500" />
        <p className="text-sm font-medium text-blue-900">{type.replace(/-/g, ' ')} - Tipo de gráfico em desenvolvimento</p>
        <p className="mt-2 text-xs text-blue-700">Este tipo será suportado em breve com visualização avançada</p>
      </div>
    );
  }

  return null;
}
