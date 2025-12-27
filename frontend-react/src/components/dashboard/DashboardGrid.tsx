import { DashboardCard } from './DashboardCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Dashboard } from '@/types/dashboard';

interface DashboardGridProps {
  dashboards: Dashboard[];
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function DashboardGrid({
  dashboards,
  onOpen,
  onEdit,
  onDelete,
  onCreate,
}: DashboardGridProps) {
  if (dashboards.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="Nenhum dashboard criado"
        description="Crie seu primeiro dashboard para começar"
        action={{
          label: 'Criar Dashboard',
          onClick: onCreate,
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {dashboards.map((dashboard) => (
        <DashboardCard
          key={dashboard.id}
          dashboard={dashboard}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
