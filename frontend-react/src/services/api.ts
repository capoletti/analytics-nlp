import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TOKEN_STORAGE_KEY = 'analytics_token';
export const UNAUTHORIZED_EVENT = 'analytics:unauthorized';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const data = error.response?.data as
      | { message?: string; error?: { message?: string } }
      | undefined;
    const message = data?.error?.message || data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export async function apiCall<T>(endpoint: string, options?: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T>({
    url: endpoint,
    ...options,
  });
  return response.data;
}
