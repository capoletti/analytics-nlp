import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useUI } from '@/contexts/UIContext';
import { useHeader } from '@/contexts/HeaderContext';
import { ChevronDown, MoreVertical } from 'lucide-react';

type View = 'dashboard' | 'explore';

interface MainLayoutProps {
  currentView: View;
  tenant: string;
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function MainLayout({ currentView, tenant, children, title: propTitle, actions: propActions }: MainLayoutProps) {
  const { isHeaderVisible, toggleHeader } = useUI();
  const { title: contextTitle, actions: contextActions } = useHeader();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const title = propTitle || contextTitle;
  const actions = propActions || contextActions;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {isHeaderVisible ? (
        <>
          <Header tenant={tenant} title={title} actions={actions} />
          <Navigation currentView={currentView} />
        </>
      ) : (
        <div className="border-b border-gray-200 bg-white">
          <div className="flex h-10 items-center justify-between px-4">
            <span className="text-sm text-gray-500">{title || 'Analytics Platform'}</span>
            <div className="flex items-center gap-2 relative">
              {actions && (
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Mais opções"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] flex flex-col gap-1 p-2">
                      {actions}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={toggleHeader}
                className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                title="Mostrar header completo"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
