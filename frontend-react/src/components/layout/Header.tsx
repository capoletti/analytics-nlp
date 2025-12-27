import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';
import { ReactNode } from 'react';

interface HeaderProps {
  tenant: string;
  title?: string;
  actions?: ReactNode;
}

export function Header({ tenant, title, actions }: HeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {title || 'Analytics Platform'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {actions && <div className="flex items-center gap-3">{actions}</div>}
          <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            Tenant: {tenant}
          </div>
          <Button variant="outline" onClick={logout} size="sm">
            <LogOut className="h-4 w-4" />
            Trocar Tenant
          </Button>
        </div>
      </div>
    </header>
  );
}
