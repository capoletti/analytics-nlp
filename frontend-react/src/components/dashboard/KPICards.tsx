import { TrendingUp, ShoppingCart, DollarSign, Users } from 'lucide-react';
import { useKPIs } from '@/hooks/useKPIs';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { DashboardData } from '@/types/dashboard';

interface KPICardsProps {
  data: DashboardData[];
}

export function KPICards({ data }: KPICardsProps) {
  const { revenue, orders, averageTicket, customers } = useKPIs(data);

  const kpis = [
    {
      id: 'revenue',
      label: 'Receita Total',
      value: formatCurrency(revenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'orders',
      label: 'Pedidos',
      value: formatNumber(orders),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'ticket',
      label: 'Ticket Médio',
      value: formatCurrency(averageTicket),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'customers',
      label: 'Clientes',
      value: formatNumber(customers),
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${kpi.bgColor}`}>
                <Icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
