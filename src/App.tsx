import { Routes, Route } from 'react-router-dom'
import { PortfolioPage } from './pages/PortfolioPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { DatenschutzPage } from './pages/DatenschutzPage'
import { AnalyticsPage, AnalyticsMetricRedirect } from './pages/AnalyticsPage'
import { AtsBookmarkletReceiver } from './components/admin/AtsBookmarkletReceiver'
import { AtsPoolBookmarkletReceiver } from './components/admin/AtsPoolBookmarkletReceiver'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminNewApplicationPage } from './pages/admin/AdminNewApplicationPage'
import { AdminApplicationDetailPage } from './pages/admin/AdminApplicationDetailPage'
import { AdminMasterProfilePage } from './pages/admin/AdminMasterProfilePage'
import { AdminJobPoolPage } from './pages/admin/AdminJobPoolPage'
import { AdminPlanPage } from './pages/admin/AdminPlanPage'

export function App() {
  return (
    <>
      <AtsBookmarkletReceiver />
      <AtsPoolBookmarkletReceiver />
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/analytics/:metricId" element={<AnalyticsMetricRedirect />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="pool" element={<AdminJobPoolPage />} />
          <Route path="plan" element={<AdminPlanPage />} />
          <Route path="new" element={<AdminNewApplicationPage />} />
          <Route path="applications/:id" element={<AdminApplicationDetailPage />} />
          <Route path="profile" element={<AdminMasterProfilePage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
