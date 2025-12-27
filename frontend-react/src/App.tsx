import { useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/UIContext';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { LoginOverlay } from '@/components/auth/LoginOverlay';
import { MainLayout } from '@/components/layout/MainLayout';
import { AppRoutes } from '@/router';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function App() {
  const location = useLocation();

  // Determine current view based on URL path
  const getCurrentView = (): 'dashboard' | 'explore' => {
    const path = location.pathname;
    if (path.includes('/explore')) return 'explore';
    return 'dashboard'; // includes /dashboard and /dashboard/new
  };

  const currentView = getCurrentView();

  return (
    <ToastProvider>
      <UIProvider>
        <HeaderProvider>
          <AuthProvider>
            {({ isAuthenticated, tenant }) => (
              <>
                {!isAuthenticated ? (
                  <LoginOverlay />
                ) : (
                  <ErrorBoundary>
                    <MainLayout currentView={currentView} tenant={tenant!}>
                      <AppRoutes />
                    </MainLayout>
                  </ErrorBoundary>
                )}
              </>
            )}
          </AuthProvider>
        </HeaderProvider>
      </UIProvider>
    </ToastProvider>
  );
}

export default App;
