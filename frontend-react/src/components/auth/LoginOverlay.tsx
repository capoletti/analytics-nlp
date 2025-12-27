import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export function LoginOverlay() {
  const [selectedTenant, setSelectedTenant] = useState('');
  const { login } = useAuth();

  const handleLogin = () => {
    if (selectedTenant) {
      login(selectedTenant);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/10 to-info/10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Platform</h1>
          <p className="mt-2 text-sm text-gray-500">Plataforma de Análise de Dados</p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Selecione o Tenant</h2>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="input"
            >
              <option value="">-- Selecione --</option>
              <option value="empresa1">Empresa 1</option>
              <option value="empresa2">Empresa 2</option>
              <option value="empresa3">Empresa 3</option>
            </select>
          </div>

          <Button
            variant="primary"
            onClick={handleLogin}
            disabled={!selectedTenant}
            className="w-full"
          >
            Entrar
          </Button>
        </div>
      </div>
    </div>
  );
}
