import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2, ListChecks } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { Button } from '@/components/ui/Button';
import { dashboardService } from '@/services/dashboardService';
import { generateDashboardFromPrompt, mapGeneratedToChartConfig } from '@/services/llmService';
import type { ChartConfig } from '@/types/chart';

export function NLDashboardGenerator() {
  const { tenant } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('Quero um painel de vendas com receita por categoria e tendência semanal.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generated, setGenerated] = useState<{
    name: string;
    description?: string;
    elements: ChartConfig[];
    filters?: Record<string, unknown>;
  } | null>(null);

  const handleGenerate = async () => {
    if (!tenant) {
      showToast('Tenant não definido. Faça login primeiro.', 'error');
      return;
    }
    if (!prompt.trim()) {
      showToast('Descreva o que você quer ver no dashboard.', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateDashboardFromPrompt(tenant, prompt.trim());
      const chartConfigs = mapGeneratedToChartConfig(result.elements);
      setGenerated({
        name: result.name,
        description: result.description,
        elements: chartConfigs,
        filters: result.filters || {},
      });
      showToast('Sugestão de dashboard gerada com IA', 'success');
    } catch (error) {
      console.error('Erro ao gerar via IA', error);
      showToast('Não foi possível gerar o dashboard com IA', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const toElementPayload = (chart: ChartConfig, index: number) => {
    const isTable = chart.type === 'table' || chart.type === 'pivot-table' || chart.type === 'pivot-heatmap';
    const isKpi = chart.type === 'kpi' || chart.type === 'kpi-trendline' || chart.type === 'gauge' || chart.type === 'progress-bar';
    const kind = isTable ? 'table' : isKpi ? 'kpi' : 'chart';
    return {
      id: chart.id,
      name: chart.title || chart.table || chart.type || `Visualização ${index + 1}`,
      type: kind,
      config: {
        type: chart.type,
        position: chart.position || { x: 0, y: index * 3, w: 4, h: 3 },
        customization: chart.customization,
        table: chart.table,
        columns: chart.columns,
        dimensions: chart.dimensions,
        metrics: chart.metrics,
        timeField: chart.timeField,
        orderBy: chart.orderBy,
        xAxis: chart.xAxis,
        yAxis: chart.yAxis,
        aggregation: chart.aggregation,
        filters: chart.filters,
      },
      sql: chart.sql || undefined,
    };
  };

  const handleCreate = async () => {
    if (!tenant || !generated) {
      showToast('Gere uma sugestão antes de criar.', 'error');
      return;
    }
    setIsCreating(true);
    try {
      const elementsPayload = generated.elements.map(toElementPayload);
      const created = await dashboardService.create(tenant, {
        name: generated.name,
        description: generated.description,
        elements: elementsPayload as any,
        filters: generated.filters || {},
      } as any);
      showToast('Dashboard criado com IA!', 'success');
      navigate(`/dashboard/${created.id}`);
    } catch (error) {
      console.error('Erro ao salvar dashboard IA', error);
      showToast('Não foi possível criar o dashboard', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-white shadow-sm">
      <div className="flex items-start gap-4 border-b border-blue-100 px-6 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50">
          <Sparkles className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">Criar dashboard com IA (AWS Bedrock)</h2>
          <p className="text-sm text-gray-600">
            Descreva o que você quer ver e geramos consultas, métricas e gráficos automaticamente. Nenhuma chave fica no frontend; a chamada vai para o backend seguro.
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Ex: Quero um painel com receita semanal, ticket médio e um ranking de produtos mais vendidos por região..."
            disabled={isGenerating || isCreating}
          />
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">ex: métricas (receita, pedidos, ticket médio)</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">ex: dimensões (categoria, região, canal)</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">ex: série temporal semanal</span>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={isGenerating || isCreating} className="flex items-center gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Gerando...' : 'Gerar com IA'}
            </Button>
            {generated && (
              <Button onClick={handleCreate} disabled={isCreating} className="flex items-center gap-2" variant="secondary">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isCreating ? 'Criando...' : 'Criar dashboard'}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <ListChecks className="h-4 w-4" />
            Resultado sugerido
          </div>
          {generated ? (
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">{generated.name}</p>
                {generated.description && <p className="text-xs text-gray-600">{generated.description}</p>}
              </div>
              <div className="space-y-1">
                {generated.elements.map((c, idx) => (
                  <div key={c.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">{c.title || c.table || `Visualização ${idx + 1}`}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">{c.type}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 truncate">x: {c.xAxis || 'auto'} • y: {(c.yAxis || []).join(', ') || 'auto'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma sugestão gerada ainda. Descreva seu dashboard e clique em "Gerar com IA".</p>
          )}
        </div>
      </div>
    </div>
  );
}
