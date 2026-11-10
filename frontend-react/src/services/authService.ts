import { apiCall } from './api';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  tenant: string;
}

export const authService = {
  login(tenant: string, password: string): Promise<LoginResponse> {
    return apiCall<LoginResponse>('/api/auth/login', {
      method: 'POST',
      data: { tenant, password },
    });
  },
};
