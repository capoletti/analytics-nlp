import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { ChartType, ChartData, ChartCustomization } from '@/types/chart';
import type { FilterState } from '@/types/filters';
import { applyFilters } from '@/utils/applyFilters';
import { chartDataService } from '@/services/chartDataService';
import { ChartSkeleton } from './ChartSkeleton';

interface ChartRendererProps {
  type: ChartType;
  data?: ChartData[];
  title: string;
  height?: number;
  isLoading?: boolean;
  error?: string | null;
  customization?: ChartCustomization;
  filters?: FilterState;
  
  // Backend loading
  tenant?: string;
  table?: string;
  sql?: string;
  onDataLoaded?: (data: ChartData[]) => void;

  // Optional explicit axis mapping
  xKey?: string;
  yKeys?: string[];
  
  // Aggregation config
  dimensions?: string[];
  metrics?: Array<{ column: string; aggregation: string }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function ChartRendererEnhanced({ 
  type, 
  data: initialData, 
  title, 
  height = 300,
  isLoading: initialLoading = false,
  error: initialError = null,
  customization: _customization,
  filters,
  tenant,
  table,
  sql,
  onDataLoaded,
  xKey: xKeyProp,
  yKeys: yKeysProp,
  dimensions,
  metrics,
}: ChartRendererProps) {
  const [rawData, setRawData] = useState<ChartData[]>(initialData || []);
  const data = useMemo(() => applyFilters(rawData, filters), [filters, rawData]);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  // Load data from backend
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
          filters: shouldSendFilters ? filters.advanced : undefined,
          dimensions: dimensions || (xKeyProp ? [xKeyProp] : undefined),
          metrics: metrics,
          xAxis: xKeyProp,
          yAxis: yKeysProp,
        });

        setRawData(response.data);
        onDataLoaded?.(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setRawData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [tenant, table, sql, filters?.advanced, onDataLoaded, xKeyProp, JSON.stringify(yKeysProp), JSON.stringify(dimensions), JSON.stringify(metrics)]);
  const keys = Object.keys(data[0] || {});
  const sample = data[0] || {};

  const isNumeric = (v: unknown) => {
    if (typeof v === 'number') return Number.isFinite(v);
    const n = parseFloat(String(v ?? ''));
    return !Number.isNaN(n) && Number.isFinite(n);
  };

  const autoX = keys.find((k) => !isNumeric((sample as Record<string, unknown>)[k])) || keys[0];
  const autoY = keys.filter((k) => k !== autoX && isNumeric((sample as Record<string, unknown>)[k]));

  const xKey = xKeyProp || autoX;
  const yKeys = (yKeysProp && yKeysProp.length ? yKeysProp : autoY.length ? autoY : keys.slice(1));

  const numericData = useMemo(() => {
    if (!data || !yKeys || yKeys.length === 0) return data || [];
    return data.map((row) => {
      const next: Record<string, unknown> = { ...(row as Record<string, unknown>) };
      yKeys.forEach((k) => {
        const v = (row as Record<string, unknown>)[k];
        if (typeof v === 'number') {
          next[k] = v;
        } else {
          const n = parseFloat(String(v ?? ''));
          next[k] = Number.isNaN(n) ? null : n;
        }
      });
      return next as ChartData;
    });
  }, [data, yKeys]);

  const hasData = data && data.length > 0;

  if (!xKey || !yKeys || yKeys.length === 0) {
    const reason = !xKey ? 'Eixo X não identificado' : 'Nenhuma métrica numérica encontrada';
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-500">
        <TrendingUp className="mb-2 h-8 w-8 opacity-60" />
        <p className="text-sm font-medium">Configuração incompleta</p>
        <p className="text-xs text-gray-400">{reason}. Revise dimensões/métricas do gráfico.</p>
      </div>
    );
  }

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

  if (!hasData) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <TrendingUp className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">Sem dados disponíveis</p>
      </div>
    );
  }

  console.debug('[ChartRendererEnhanced] keys:', keys, 'xKey:', xKey, 'yKeys:', yKeys, 'height:', height, 'type:', type, 'sample:', sample);

  if (type === 'table') {
    return (
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {keys.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.slice(0, 50).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {keys.map((key) => (
                  <td key={key} className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                    {String(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'kpi') {
    const raw = data[0]?.[keys[0]];
    const value = typeof raw === 'number' ? raw : parseFloat(String(raw ?? 0)) || 0;
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-6xl font-bold text-primary">{value.toLocaleString()}</div>
        <div className="mt-4 text-sm text-gray-600">{title}</div>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={numericData} margin={{ top: 20, right: 20, left: 50, bottom: 20 }}>
          {import.meta.env.DEV && (
            // simple debug element to confirm render path
            <text x={10} y={10} fill="#6b7280">bar chart</text>
          )}
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }} 
          />
          <Legend />
          {yKeys.map((key, idx) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={COLORS[idx % COLORS.length]} 
              fillOpacity={1}
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={numericData} margin={{ top: 20, right: 20, left: 50, bottom: 20 }}>
          {import.meta.env.DEV && (
            <text x={10} y={10} fill="#6b7280">line chart</text>
          )}
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }} 
          />
          <Legend />
          {yKeys.map((key, idx) => (
            <Line 
              key={key} 
              type="monotone" 
              dataKey={key} 
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={3}
              dot={{ fill: COLORS[idx % COLORS.length], r: 5 }}
              activeDot={{ r: 7 }}
              isAnimationActive={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={numericData} margin={{ top: 20, right: 20, left: 50, bottom: 20 }}>
          {import.meta.env.DEV && (
            <text x={10} y={10} fill="#6b7280">area chart</text>
          )}
        <defs>
          {yKeys.map((key, idx) => (
            <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }} 
        />
        <Legend />
        {yKeys.map((key, idx) => (
          <Area 
            key={key} 
            type="monotone" 
            dataKey={key} 
            fill={`url(#color${key})`}
            stroke={COLORS[idx % COLORS.length]}
            strokeWidth={3}
            isAnimationActive={true}
          />
        ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    const outer = Math.max(40, Math.floor(height / 2) - 8);
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          {import.meta.env.DEV && (
            <text x={10} y={10} fill="#6b7280">pie chart</text>
          )}
          <Pie
            data={data}
            dataKey={yKeys[0]}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={outer}
            label
            isAnimationActive={true}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
