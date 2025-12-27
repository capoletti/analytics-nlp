import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { DashboardEditorPage } from '@/components/dashboard/DashboardEditorPage';
import { DashboardDetailPage } from '@/components/dashboard/DashboardDetailPage';
import { CatalogView } from '@/components/catalog/CatalogView';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/dashboard" element={<DashboardView />} />
      <Route path="/dashboard/new" element={<DashboardEditorPage />} />
      <Route path="/dashboard/:id" element={<DashboardDetailPage />} />
      <Route path="/dashboard/edit/:id" element={<DashboardEditorPage />} />
      <Route path="/explore" element={<CatalogView />} />
      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
