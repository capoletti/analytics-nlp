import { apiCall } from './api';
import type { Dashboard, DashboardData } from '@/types/dashboard';
import type { ChartConfig } from '@/types/chart';

interface DashboardPayload {
  name: string;
  description?: string;
  elements?: ChartConfig[];
  filters?: Record<string, unknown>;
}

export const dashboardService = {
  async getAll(tenantId: string): Promise<Dashboard[]> {
    const { dashboards } = await apiCall<{ dashboards: Dashboard[] }>(
      `/api/dashboards/${tenantId}`
    );
    return dashboards || [];
  },

  async getById(tenantId: string, id: string): Promise<Dashboard> {
    return apiCall<Dashboard>(`/api/dashboards/${tenantId}/${id}`);
  },

  async getData(tenantId: string, dashboardId: string): Promise<DashboardData[]> {
    const { data } = await apiCall<{ data: DashboardData[] }>(
      `/api/dashboards/${tenantId}/${dashboardId}/data`
    );
    return data || [];
  },

  async create(
    tenantId: string,
    payload: DashboardPayload
  ): Promise<Dashboard> {
    return apiCall<Dashboard>(`/api/dashboards/${tenantId}`, {
      method: 'POST',
      data: {
        name: payload.name,
        description: payload.description || '',
        elements: payload.elements || [],
        filters: payload.filters || {},
      },
    });
  },

  async update(tenantId: string, id: string, updates: Partial<DashboardPayload>): Promise<Dashboard> {
    return apiCall<Dashboard>(`/api/dashboards/${tenantId}/${id}`, {
      method: 'PUT',
      data: updates,
    });
  },

  async delete(tenantId: string, id: string): Promise<void> {
    await apiCall<void>(`/api/dashboards/${tenantId}/${id}`, {
      method: 'DELETE',
    });
  },
};
