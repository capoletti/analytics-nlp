import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { generateMockData } from '@/services/mockDataService';
import { useToast } from '@/hooks/useToast';
import type { Dashboard, DashboardData } from '@/types/dashboard';

export function useDashboards(tenantId: string | null) {
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [data, setData] = useState<DashboardData[]>([]);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const {
    data: dashboards = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboards', tenantId],
    queryFn: () => (tenantId ? dashboardService.getAll(tenantId) : Promise.resolve([])),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      dashboardService.create(tenantId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards', tenantId] });
      showToast('Dashboard criado com sucesso!', 'success');
    },
    onError: () => {
      showToast('Erro ao criar dashboard', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Dashboard> }) =>
      dashboardService.update(tenantId!, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards', tenantId] });
      showToast('Dashboard atualizado!', 'success');
    },
    onError: () => {
      showToast('Erro ao atualizar dashboard', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dashboardService.delete(tenantId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards', tenantId] });
      setCurrentDashboard(null);
      showToast('Dashboard removido!', 'success');
    },
    onError: () => {
      showToast('Erro ao remover dashboard', 'error');
    },
  });

  const openDashboard = useCallback(
    async (dashboardId: string) => {
      const dashboard = dashboards.find((d) => d.id === dashboardId);
      if (!dashboard) return;

      setCurrentDashboard(dashboard);

      try {
        const dashboardData = await dashboardService.getData(tenantId!, dashboardId);
        setData(dashboardData);
      } catch {
        // Fallback to mock data
        const mockData = generateMockData(tenantId!);
        setData(mockData);
      }
    },
    [dashboards, tenantId]
  );

  const closeDashboard = useCallback(() => {
    setCurrentDashboard(null);
    setData([]);
  }, []);

  return {
    dashboards,
    currentDashboard,
    data,
    isLoading,
    error,
    openDashboard,
    closeDashboard,
    createDashboard: createMutation.mutate,
    updateDashboard: (id: string, updates: Partial<Dashboard>) =>
      updateMutation.mutate({ id, updates }),
    deleteDashboard: deleteMutation.mutate,
  };
}
