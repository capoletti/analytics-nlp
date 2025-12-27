import { apiCall } from './api';
import { CatalogResponse } from '@/types/catalog';

export const catalogService = {
  async getTables(tenantId: string): Promise<CatalogResponse> {
    return apiCall<CatalogResponse>(`/api/catalog/${tenantId}`);
  },
};
