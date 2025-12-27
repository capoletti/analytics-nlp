import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardGrid } from './DashboardGrid';
import type { Dashboard } from '@/types/dashboard';

interface DashboardListProps {
  dashboards: Dashboard[];
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DashboardList({
  dashboards,
  onOpen,
  onEdit,
  onDelete,
}: DashboardListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Meus Dashboards</h2>
        <Button variant="primary" onClick={() => navigate('/dashboard/new')}>
          <Plus className="h-4 w-4" />
          Novo Dashboard
        </Button>
      </div>

      <DashboardGrid
        dashboards={dashboards}
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreate={() => navigate('/dashboard/new')}
      />
    </div>
  );
}
