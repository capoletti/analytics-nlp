import { useMemo } from 'react';
import type { DashboardData, KPIMetrics } from '@/types/dashboard';

export function useKPIs(data: DashboardData[]): KPIMetrics {
  return useMemo(() => {
    const revenue = data.reduce((sum, item) => sum + (item.valor || 0), 0);
    const orders = data.length;
    const averageTicket = orders > 0 ? revenue / orders : 0;
    const customers = new Set(data.map((d) => d.cliente)).size;

    return {
      revenue,
      orders,
      averageTicket,
      customers,
    };
  }, [data]);
}
