import type { ChartConfig } from './chart';

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  elements?: ChartConfig[];
  filters?: Record<string, unknown>;
}

export interface DashboardData {
  id: number;
  data: string;
  cliente: string;
  categoria: string;
  regiao: string;
  canal: string;
  valor: number;
  [key: string]: unknown;
}

export interface KPIMetrics {
  revenue: number;
  orders: number;
  averageTicket: number;
  customers: number;
}

export interface ChartData {
  labels: string[];
  values: number[];
}
