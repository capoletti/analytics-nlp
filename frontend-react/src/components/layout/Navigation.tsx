import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useUI } from '@/contexts/UIContext';

type View = 'dashboard' | 'explore';

interface NavigationProps {
  currentView: View;
}

const navItems = [
  { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'explore' as View, label: 'Explorar Dados', icon: Database, path: '/explore' },
];

export function Navigation({ currentView }: NavigationProps) {
  const navigate = useNavigate();
  const { toggleHeader } = useUI();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={clsx(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={toggleHeader}
          className="flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          title="Minimizar header"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
