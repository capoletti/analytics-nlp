import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { Button } from '@/components/ui/Button';

export function DashboardCreateForm() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { showToast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenant) {
      showToast('Erro: tenant não encontrado', 'error');
      return;
    }

    if (name.trim().length === 0) {
      showToast('Nome do dashboard é obrigatório', 'error');
      return;
    }

    setIsSubmitting(true);
    // Do not create via API yet; backend requires at least one element.
    // Navigate to editor with initial metadata to create after first chart is added.
    navigate('/dashboard/new', { state: { name: name.trim(), description: description.trim() } });
    setIsSubmitting(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')} size="sm">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">✨ Novo Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Crie um dashboard e comece a adicionar gráficos
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || name.trim().length === 0}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isSubmitting ? 'Criando...' : 'Criar e Editar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="container mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Defina o nome e descrição do seu dashboard
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Dashboard *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ex: Vendas Mensais, Análise de Marketing, KPIs Financeiros..."
                    maxLength={255}
                    required
                    disabled={isSubmitting}
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    {name.length}/255 caracteres
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Descreva o objetivo deste dashboard, quais métricas ele apresenta e para quem é direcionado..."
                    maxLength={1000}
                    disabled={isSubmitting}
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    {description.length}/1000 caracteres
                  </p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900">Próximo passo</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Após criar o dashboard, você será redirecionado para o editor onde poderá adicionar gráficos, 
                    configurar visualizações e personalizar as cores e estilos.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
