import { useEffect, useMemo, useState, useCallback } from 'react';
import { X, Save, Database, Palette, ChevronDown, AlertCircle } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ChartType, ChartConfig, ChartData } from '@/types/chart';
import { ChartRenderer } from '@/components/charts/ChartRenderer';
import { chartDataService, TableSchema } from '@/services/chartDataService';

interface ChartEditorProps {
  chart?: ChartConfig;
  onSave: (chart: ChartConfig) => void;
  onCancel: () => void;
  availableTables: string[];
  tenant?: string | null;
}

type ChartCategory = 'temporal' | 'barras' | 'linhas' | 'circular' | 'dispersao' | 'tabela' | 'indicadores' | 'outros';

interface ChartTypeOption {
  value: ChartType;
  label: string;
  description: string;
  icon: string;
  category: ChartCategory;
}

const CHART_CATEGORIES: Record<ChartCategory, string> = {
  temporal: '📈 Séries Temporais',
  barras: '📊 Gráficos de Barras',
  linhas: '📉 Linhas e Área',
  circular: '🥧 Circulares e Pizza',
  dispersao: '💫 Dispersão e Bolhas',
  tabela: '📋 Tabelas',
  indicadores: '🎯 Indicadores e Métricas',
  outros: '✨ Outros',
};

const CHART_TYPES: ChartTypeOption[] = [
  // Séries Temporais
  { value: 'time-series-line', label: 'Linha Temporal', description: 'Série temporal em linhas', icon: '📈', category: 'temporal' },
  { value: 'time-series-bar', label: 'Barras Temporais', description: 'Série temporal em barras', icon: '📊', category: 'temporal' },
  { value: 'time-series-area', label: 'Área Temporal', description: 'Série temporal em área', icon: '📉', category: 'temporal' },
  { value: 'time-series-percent', label: 'Porcentagem Temporal', description: 'Porcentagens ao longo do tempo', icon: '📈', category: 'temporal' },

  // Gráficos de Barras
  { value: 'bar', label: 'Barras Verticais', description: 'Barras verticais simples', icon: '📊', category: 'barras' },
  { value: 'bar-horizontal', label: 'Barras Horizontais', description: 'Barras horizontais simples', icon: '📊', category: 'barras' },
  { value: 'bar-stacked', label: 'Barras Empilhadas', description: 'Barras empilhadas com composição', icon: '📊', category: 'barras' },
  { value: 'bar-grouped', label: 'Barras Agrupadas', description: 'Barras agrupadas por categoria', icon: '📊', category: 'barras' },

  // Linhas e Área
  { value: 'line', label: 'Linhas', description: 'Gráfico de linhas simples', icon: '📉', category: 'linhas' },
  { value: 'area', label: 'Área', description: 'Gráfico de área preenchida', icon: '📉', category: 'linhas' },
  { value: 'area-stacked', label: 'Área Empilhada', description: 'Área empilhada com composição', icon: '📉', category: 'linhas' },

  // Circulares
  { value: 'pie', label: 'Pizza', description: 'Gráfico de pizza tradicional', icon: '🥧', category: 'circular' },
  { value: 'sunburst', label: 'Sunburst', description: 'Hierarquia em círculos concêntricos', icon: '🥧', category: 'circular' },
  { value: 'treemap', label: 'Treemap', description: 'Blocos proporcionais por valor', icon: '🥧', category: 'circular' },

  // Dispersão e Bolhas
  { value: 'scatter', label: 'Dispersão', description: 'Pontos em dispersão', icon: '💫', category: 'dispersao' },
  { value: 'bubble', label: 'Bolhas', description: 'Pontos com tamanho variável', icon: '💫', category: 'dispersao' },

  // Tabelas
  { value: 'table', label: 'Tabela', description: 'Tabela simples com valores', icon: '📋', category: 'tabela' },
  { value: 'pivot-table', label: 'Tabela Dinâmica', description: 'Tabela dinâmica com agregações', icon: '📋', category: 'tabela' },
  { value: 'pivot-heatmap', label: 'Tabela Dinâmica (Heatmap)', description: 'Tabela com gradiente de cores', icon: '📋', category: 'tabela' },

  // Indicadores
  { value: 'kpi', label: 'Número Grande', description: 'Número grande de destaque', icon: '🎯', category: 'indicadores' },
  { value: 'kpi-trendline', label: 'Número com Tendência', description: 'Número grande com linha de tendência', icon: '🎯', category: 'indicadores' },
  { value: 'gauge', label: 'Medidor', description: 'Medidor estilo velocímetro', icon: '🎯', category: 'indicadores' },
  { value: 'progress-bar', label: 'Barra de Progresso', description: 'Barra de progresso em valor', icon: '🎯', category: 'indicadores' },

  // Outros
  { value: 'sankey', label: 'Sankey', description: 'Fluxo entre categorias', icon: '✨', category: 'outros' },
  { value: 'wordcloud', label: 'Nuvem de Palavras', description: 'Nuvem de palavras por frequência', icon: '✨', category: 'outros' },
  { value: 'histogram', label: 'Histograma', description: 'Histograma de distribuição', icon: '✨', category: 'outros' },
  { value: 'boxplot', label: 'Boxplot', description: 'Distribuição com quartis', icon: '✨', category: 'outros' },
  { value: 'rose', label: 'Rose Chart', description: 'Gráfico polar radial', icon: '✨', category: 'outros' },
];

interface ChartCustomization {
  primaryColor: string;
  accentColor: string;
  showLegend: boolean;
  showGrid: boolean;
  showTooltip: boolean;
  animationEnabled: boolean;
  height: number;
  width: string;
  dateFormat?: string;
  numberFormat?: string;
}

export function ChartEditor({ chart, onSave, onCancel, availableTables, tenant }: ChartEditorProps) {
  const [type, setType] = useState<ChartType | undefined>(chart?.type);
  const [title, setTitle] = useState(chart?.title || '');
  const [table, setTable] = useState(chart?.table || '');
  const [sql, setSql] = useState(chart?.sql || '');
  const [useCustomSQL, setUseCustomSQL] = useState(!!chart?.sql);
  const [activeTab, setActiveTab] = useState<'data'|'fields'|'style'>('data');
  const [expandedCategory, setExpandedCategory] = useState<ChartCategory | null>('barras');
  const [showCustomization, setShowCustomization] = useState(false);
  const [columns, setColumns] = useState<TableSchema['columns']>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [dimensions, setDimensions] = useState<string[]>(chart?.dimensions || []);
  const [metrics, setMetrics] = useState<Array<{ column: string; aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' }>>(chart?.metrics || []);
  const [timeField, setTimeField] = useState<string>(chart?.timeField || '');
  const [metricColumn, setMetricColumn] = useState<string>('');
  const [metricAgg, setMetricAgg] = useState<'sum' | 'count' | 'avg' | 'min' | 'max'>('sum');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ChartData[]>([]);
  const [expandedType, setExpandedType] = useState(!chart);
  const [expandedPreview, setExpandedPreview] = useState(true);
  
  const defaultCustomization: ChartCustomization = {
    primaryColor: '#0088FE',
    accentColor: '#00C49F',
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    animationEnabled: true,
    height: 400,
    width: '100%',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '#,##0.00',
  };
  
  const [customization, setCustomization] = useState<ChartCustomization>(
    chart?.customization ? { ...defaultCustomization, ...chart.customization } : defaultCustomization
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type) {
      alert('Por favor, selecione um tipo de gráfico');
      return;
    }

    // Se não for SQL customizado, construir SQL com dimensões e métricas
    let finalSql: string | undefined;
    if (!useCustomSQL && table) {
      finalSql = buildPreviewSQL() || undefined;
    } else {
      finalSql = useCustomSQL ? sql : undefined;
    }
    
    onSave({
      id: chart?.id || `chart-${Date.now()}`,
      type,
      title,
      table: useCustomSQL ? undefined : table,
      sql: finalSql,
      dimensions: dimensions.length ? dimensions : undefined,
      metrics: metrics.length ? metrics : undefined,
      timeField: timeField || undefined,
      columns: [],
      filters: {},
      position: chart?.position || { x: 0, y: 0, w: 1, h: 3 },
      customization,
    });
  };

  const parseColumnType = (dataType?: string) => {
    const dt = (dataType || '').toLowerCase();
    if (dt.includes('timestamp') || dt.includes('date')) return 'date';
    if (dt.match(/int|decimal|double|real|numeric|float/)) return 'number';
    return 'string';
  };

  const dateColumns = columns.filter((c) => parseColumnType(c.data_type) === 'date');
  const textColumns = columns.filter((c) => parseColumnType(c.data_type) === 'string');
  const numericColumns = columns.filter((c) => parseColumnType(c.data_type) === 'number');

  const applySuggestions = useCallback((cols: TableSchema['columns']) => {
    const needsTimeField = type && type.includes('time-series');

    if (needsTimeField && !timeField) {
      const firstDate = cols.find((c) => parseColumnType(c.data_type) === 'date');
      if (firstDate) setTimeField(firstDate.column_name);
    }
    if (dimensions.length === 0) {
      const firstText = cols.find((c) => parseColumnType(c.data_type) === 'string');
      if (firstText) setDimensions([firstText.column_name]);
    }
    if (metrics.length === 0) {
      const firstNum = cols.find((c) => parseColumnType(c.data_type) === 'number');
      if (firstNum) {
        setMetrics([{ column: firstNum.column_name, aggregation: 'sum' }]);
      } else if (cols[0]) {
        setMetrics([{ column: cols[0].column_name, aggregation: 'count' }]);
      }
    }
  }, [dimensions.length, metrics.length, timeField, type]);

  const buildPreviewSQL = useCallback(() => {
    if (!tenant || !table) return '';

    const selectParts: string[] = [];
    const groupBy: string[] = [];

    const addGroupBy = (col?: string) => {
      if (col && !groupBy.includes(col)) groupBy.push(col);
    };

    if (timeField) {
      selectParts.push(timeField);
      addGroupBy(timeField);
    }

    dimensions.forEach((col) => {
      selectParts.push(col);
      addGroupBy(col);
    });

    const metricList = metrics.length
      ? metrics
      : [{ column: '*', aggregation: 'count' as const }];

    metricList.forEach((m) => {
      const colExpr = m.column === '*' ? '1' : m.column;
      const aggExpr = m.aggregation === 'count' && m.column === '*'
        ? 'count(1)'
        : `${m.aggregation}(${colExpr})`;
      const aliasBase = m.column.replace(/[^a-zA-Z0-9_]/g, '') || 'all';
      const alias = `${m.aggregation}_${aliasBase}`;
      selectParts.push(`${aggExpr} AS ${alias}`);
    });

    const selectClause = selectParts.join(', ');
    const groupClause = groupBy.length ? ` GROUP BY ${groupBy.join(', ')}` : '';

    return `SELECT ${selectClause} FROM ${tenant}.${table}${groupClause} LIMIT 50`;
  }, [tenant, table, timeField, dimensions, metrics]);

  useEffect(() => {
    const loadSchema = async () => {
      if (!tenant || useCustomSQL || !table) {
        setColumns([]);
        return;
      }
      try {
        setLoadingColumns(true);
        const schema = await chartDataService.getTableSchema(tenant, table, tenant);
        const cols = schema?.columns || [];
        setColumns(cols);
        applySuggestions(cols);
      } catch (err) {
        console.error('Erro ao carregar schema:', err);
        setColumns([]);
      } finally {
        setLoadingColumns(false);
      }
    };

    loadSchema();
  }, [tenant, table, useCustomSQL, applySuggestions]);

  // Limpar preview quando campos relevantes mudam
  useEffect(() => {
    setPreviewRows([]);
    setPreviewError(null);
  }, [table, sql, timeField, dimensions, metrics, type]);

  const getChartsByCategory = (category: ChartCategory) => {
    return CHART_TYPES.filter(c => c.category === category);
  };

  const getSelectedChartLabel = () => {
    if (!type) return 'Selecione um tipo';
    const chartOption = CHART_TYPES.find(c => c.value === type);
    return chartOption ? chartOption.label : 'Tipo desconhecido';
  };

  const canPreview = useMemo(() => {
    if (isPreviewLoading) return false;
    if (useCustomSQL) return sql.trim().length > 0;
    return table.trim().length > 0;
  }, [isPreviewLoading, useCustomSQL, sql, table]);

  const handlePreview = useCallback(async () => {
    if (!tenant) {
      setPreviewError('Selecione um tenant para pré-visualizar.');
      return;
    }

    if (!canPreview) {
      setPreviewError('Escolha uma tabela ou informe uma SQL para pré-visualizar.');
      return;
    }

    setPreviewError(null);
    setIsPreviewLoading(true);
    try {
      const queryToPreview = useCustomSQL ? sql : buildPreviewSQL();
      if (!queryToPreview.trim()) {
        throw new Error('Nenhuma consulta gerada para pré-visualizar.');
      }

      const response = await chartDataService.getChartDataPreview(tenant, {
        table: undefined,
        sql: queryToPreview,
        limit: 50,
        offset: 0,
      });
      setPreviewRows(response.data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar prévia';
      setPreviewError(message);
      setPreviewRows([]);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [tenant, canPreview, useCustomSQL, sql, buildPreviewSQL]);

  const handleAddDimension = (col: string) => {
    if (!col || dimensions.includes(col)) return;
    setDimensions([...dimensions, col]);
  };

  const handleRemoveDimension = (col: string) => {
    setDimensions(dimensions.filter((c) => c !== col));
  };

  const handleAddMetric = () => {
    if (!metricColumn) return;
    setMetrics([...metrics, { column: metricColumn, aggregation: metricAgg }]);
    setMetricColumn('');
    setMetricAgg('sum');
  };

  const handleRemoveMetric = (col: string) => {
    setMetrics(metrics.filter((m) => m.column !== col));
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-screen w-[70vw] max-w-5xl flex-col bg-white shadow-2xl lg:w-[72vw]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {chart ? '✏️ Editar Gráfico' : '➕ Novo Gráfico'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="chart-form"
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
            >
              <Save className="h-4 w-4" />
              Salvar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - Single Column with Accordion Sections */}
        <form id="chart-form" onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-6">
              {/* Título */}
              <section>
                <label htmlFor="title" className="mb-2 block text-sm font-semibold text-gray-900">
                  📝 Título do Gráfico
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Vendas por Região no Trimestre"
                  required
                />
              </section>

              {/* Accordion: Tipo de Gráfico */}
              <section className="rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setExpandedType(!expandedType)}
                  className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-100"
                >
                  <span>📊 Tipo de Gráfico: <span className="font-normal text-primary">{getSelectedChartLabel()}</span></span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedType ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedType && (
                  <div className="border-t border-gray-200 px-4 py-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(Object.keys(CHART_CATEGORIES) as ChartCategory[]).map((category) => (
                        <div key={category}>
                          <button
                            type="button"
                            onClick={() => setExpandedCategory(
                              expandedCategory === category ? null : category
                            )}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <span>{CHART_CATEGORIES[category]}</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedCategory === category ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedCategory === category && (
                            <div className="ml-2 space-y-1 py-1">
                              {getChartsByCategory(category).map((chartOption) => (
                                <button
                                  key={chartOption.value}
                                  type="button"
                                  onClick={() => {
                                    setType(chartOption.value);
                                    setExpandedType(false);
                                  }}
                                  className={`flex w-full items-start rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                    type === chartOption.value
                                      ? 'bg-primary text-white shadow-md'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="mr-2 text-lg">{chartOption.icon}</span>
                                  <div>
                                    <div className="font-medium">{chartOption.label}</div>
                                    <div className={`text-xs ${
                                      type === chartOption.value
                                        ? 'text-primary-light'
                                        : 'text-gray-500'
                                    }`}>
                                      {chartOption.description}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Tabs for Data/Fields/Style */}
              <div>
                <SegmentedControl
                  segments={[
                    { label: 'Dados', value: 'data' },
                    { label: 'Campos', value: 'fields' },
                    { label: 'Estilo', value: 'style' },
                  ]}
                  value={activeTab}
                  onChange={(v) => setActiveTab(v as 'data' | 'fields' | 'style')}
                />
              </div>

              {/* Fonte de Dados */}
              {activeTab === 'data' && (
              <section>
                <div className="mb-4">
                  <SegmentedControl
                    segments={[
                      { label: 'Selecionar Tabela', value: 'table' },
                      { label: 'SQL Personalizado', value: 'sql' },
                    ]}
                    value={useCustomSQL ? 'sql' : 'table'}
                    onChange={(v) => setUseCustomSQL(v === 'sql')}
                  />
                </div>

                {!useCustomSQL ? (
                  <div>
                    <label htmlFor="table" className="mb-2 block text-sm font-medium text-gray-700">
                      Tabela
                    </label>
                    <div className="relative">
                      <Database className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <select
                        id="table"
                        value={table}
                        onChange={(e) => setTable(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required={!useCustomSQL}
                      >
                        <option value="">Selecione uma tabela...</option>
                        {availableTables.map((tbl) => (
                          <option key={tbl} value={tbl}>
                            {tbl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="sql" className="mb-2 block text-sm font-medium text-gray-700">
                      Consulta SQL
                    </label>
                    <textarea
                      id="sql"
                      value={sql}
                      onChange={(e) => setSql(e.target.value)}
                      rows={6}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="SELECT coluna1, COUNT(*) as total FROM tabela GROUP BY coluna1 LIMIT 100"
                      required={useCustomSQL}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      💡 Use SQL padrão Trino. A consulta deve retornar dados estruturados para visualização.
                    </p>
                  </div>
                )}
              </section>
              )}

              {/* Campos (dimensões, métricas, tempo) */}
              {activeTab === 'fields' && !useCustomSQL && (
                <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-semibold text-gray-900">🧩 Campos</div>
                    {loadingColumns && (
                      <span className="text-xs text-gray-500">Carregando colunas...</span>
                    )}
                  </div>
                  <p className="mb-4 text-xs text-gray-500">Escolha uma coluna de data para séries temporais, adicione categorias em Dimensões e valores em Métricas.</p>

                  {columns.length === 0 && !loadingColumns && (
                    <p className="text-sm text-gray-500">Selecione uma tabela para ver as colunas.</p>
                  )}

                  {columns.length > 0 && (
                    <div className="space-y-4">
                      <div className="mb-4 space-y-2">
                        <p className="text-xs text-gray-500">Escolha uma coluna de data para séries temporais, adicione categorias em <strong>Dimensões</strong> e valores em <strong>Métricas</strong>.</p>
                        {type && type.includes('time-series') && !timeField && (
                          <div className="flex items-start gap-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>Este gráfico precisa de uma <strong>Série Temporal</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Série Temporal */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Série Temporal (data)</label>
                        <select
                          value={timeField}
                          onChange={(e) => setTimeField(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Nenhuma</option>
                          {dateColumns.map((col) => (
                            <option key={col.column_name} value={col.column_name}>
                              {col.column_name} · {col.data_type}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dimensões */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Dimensões (categorias)</label>
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => handleAddDimension(e.target.value)}
                            value=""
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Adicionar dimensão...</option>
                            {textColumns.concat(dateColumns).map((col) => (
                              <option key={col.column_name} value={col.column_name}>
                                {col.column_name} · {col.data_type}
                              </option>
                            ))}
                          </select>
                        </div>
                        {dimensions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {dimensions.map((dim) => (
                              <span
                                key={dim}
                                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                              >
                                {dim}
                                <button onClick={() => handleRemoveDimension(dim)} className="text-primary hover:text-primary-dark">
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Métricas */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Métricas (valores)</label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <select
                            value={metricColumn}
                            onChange={(e) => setMetricColumn(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Escolher coluna numérica...</option>
                            {numericColumns.map((col) => (
                              <option key={col.column_name} value={col.column_name}>
                                {col.column_name} · {col.data_type}
                              </option>
                            ))}
                          </select>
                          <select
                            value={metricAgg}
                            onChange={(e) => setMetricAgg(e.target.value as typeof metricAgg)}
                            className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="sum">Soma</option>
                            <option value="avg">Média</option>
                            <option value="count">Contagem</option>
                            <option value="min">Mínimo</option>
                            <option value="max">Máximo</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleAddMetric}
                            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark"
                          >
                            Adicionar
                          </button>
                        </div>

                        {metrics.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {metrics.map((m) => (
                              <span
                                key={`${m.column}-${m.aggregation}`}
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                              >
                                {m.aggregation.toUpperCase()}({m.column})
                                <button onClick={() => handleRemoveMetric(m.column)} className="text-emerald-700 hover:text-emerald-900">
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Customização */}
              {activeTab === 'style' && (
              <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <button
                  type="button"
                  onClick={() => setShowCustomization(!showCustomization)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-gray-900"
                >
                  <span className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Personalização Avançada
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showCustomization ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showCustomization && (
                  <div className="mt-4 space-y-4">
                    {/* Cores */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Cor Primária
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={customization.primaryColor}
                            onChange={(e) =>
                              setCustomization({
                                ...customization,
                                primaryColor: e.target.value,
                              })
                            }
                            className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customization.primaryColor}
                            onChange={(e) =>
                              setCustomization({
                                ...customization,
                                primaryColor: e.target.value,
                              })
                            }
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                            placeholder="#0088FE"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Cor Secundária
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={customization.accentColor}
                            onChange={(e) =>
                              setCustomization({
                                ...customization,
                                accentColor: e.target.value,
                              })
                            }
                            className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customization.accentColor}
                            onChange={(e) =>
                              setCustomization({
                                ...customization,
                                accentColor: e.target.value,
                              })
                            }
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                            placeholder="#00C49F"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Opções de Visualização */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showLegend"
                          checked={customization.showLegend}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              showLegend: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        <label htmlFor="showLegend" className="text-sm font-medium text-gray-700">
                          Mostrar Legenda
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showGrid"
                          checked={customization.showGrid}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              showGrid: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        <label htmlFor="showGrid" className="text-sm font-medium text-gray-700">
                          Mostrar Grade
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showTooltip"
                          checked={customization.showTooltip}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              showTooltip: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        <label htmlFor="showTooltip" className="text-sm font-medium text-gray-700">
                          Mostrar Dicas ao Passar
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="animationEnabled"
                          checked={customization.animationEnabled}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              animationEnabled: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        <label htmlFor="animationEnabled" className="text-sm font-medium text-gray-700">
                          Ativar Animações
                        </label>
                      </div>
                    </div>

                    {/* Formato de Data */}
                    <div>
                      <label htmlFor="dateFormat" className="mb-2 block text-sm font-medium text-gray-700">
                        Formato de Data
                      </label>
                      <select
                        id="dateFormat"
                        value={customization.dateFormat}
                        onChange={(e) =>
                          setCustomization({
                            ...customization,
                            dateFormat: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD MMM YYYY">DD MMM YYYY</option>
                      </select>
                    </div>

                    {/* Formato de Número */}
                    <div>
                      <label htmlFor="numberFormat" className="mb-2 block text-sm font-medium text-gray-700">
                        Formato de Número
                      </label>
                      <select
                        id="numberFormat"
                        value={customization.numberFormat}
                        onChange={(e) =>
                          setCustomization({
                            ...customization,
                            numberFormat: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="#,##0.00">1,234.56</option>
                        <option value="#,##0">1,235</option>
                        <option value="0.00">1234.56</option>
                        <option value="0.0">1234.6</option>
                      </select>
                    </div>
                  </div>
                )}
              </section>
              )}

              {/* Accordion: Preview */}
              {(activeTab === 'data' || activeTab === 'fields' || activeTab === 'style') && (
              <section className="rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setExpandedPreview(!expandedPreview)}
                  className="flex w-full items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 font-semibold text-gray-900 hover:from-gray-100 hover:to-gray-200 transition-all"
                >
                  <span>📊 Prévia do Gráfico e Dados</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedPreview ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedPreview && (
                  <div className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 px-4 py-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-gray-700">
                          {useCustomSQL ? 'SQL Personalizado' : `Tabela: ${table || 'nenhuma'}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePreview}
                        disabled={!canPreview}
                        className={`group relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 ${
                          canPreview 
                            ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-md hover:scale-105 active:scale-95' 
                            : 'cursor-not-allowed bg-gray-300 text-gray-500'
                        }`}
                      >
                        {isPreviewLoading ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Carregando...
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Atualizar
                          </>
                        )}
                      </button>
                    </div>

                    {previewError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4 shadow-sm">
                        ⚠️ {previewError}
                      </div>
                    )}

                    {!previewError && previewRows.length === 0 && !isPreviewLoading && (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">📭 Nenhuma prévia carregada. Clique em "Atualizar" para visualizar.</p>
                      </div>
                    )}

                    {previewRows.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Gráfico (esquerda) */}
                        <div className="rounded-lg border-2 border-primary/20 bg-white shadow-lg overflow-hidden flex flex-col">
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
                            <div className="text-sm font-bold text-gray-800">📊 Visualização do Gráfico</div>
                          </div>
                          <div className="h-96 bg-gradient-to-b from-gray-50 to-white overflow-hidden p-1">
                            <div style={{ fontSize: '0.75rem' }}>
                              {type && (
                                <ChartRenderer
                                  type={type}
                                  title={title || 'Prévia'}
                                  data={previewRows}
                                  height={360}
                                  customization={{
                                    ...customization,
                                    height: 360,
                                    width: '100%',
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tabela de dados (direita) */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              📋 Dados da Tabela
                              <span className="text-xs text-gray-500">({previewRows.length} linhas)</span>
                            </div>
                          </div>
                          <div className="h-96 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                                <tr>
                                  {Object.keys(previewRows[0] || {}).map((col) => (
                                    <th key={col} className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {previewRows.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                    {Object.values(row).map((val, i) => (
                                      <td key={i} className="px-3 py-2 text-xs text-gray-700">
                                        {String(val ?? '')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
}