import { Routes, Route } from 'react-router-dom'
import { PortfolioPage } from './pages/PortfolioPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { DatenschutzPage } from './pages/DatenschutzPage'
import { AnalyticsPage, AnalyticsMetricRedirect, AnalyticsLegacyRedirect } from './pages/AnalyticsPage'
import { ABTestPage } from './pages/ABTestPage'
import { PerformancePage } from './pages/PerformancePage'
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
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage'
import { MonitorPage } from './pages/monitor/MonitorPage'

export function App() {
  return (
    <>
      <AtsBookmarkletReceiver />
      <AtsPoolBookmarkletReceiver />
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/demo/analytics" element={<AnalyticsPage />} />
        <Route path="/demo/ab-test" element={<ABTestPage />} />
        <Route path="/demo/performance" element={<PerformancePage />} />
        <Route
          path="/analytics"
          element={<AnalyticsLegacyRedirect />}
        />
        <Route path="/analytics/:metricId" element={<AnalyticsMetricRedirect />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/monitor"
          element={
            <ProtectedRoute require="monitor">
              <MonitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute require="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="pool" element={<AdminJobPoolPage />} />
          <Route path="plan" element={<AdminPlanPage />} />
          <Route path="companies" element={<AdminCompaniesPage />} />
          <Route path="suggestions" element={<AdminCompaniesPage />} />
          <Route path="new" element={<AdminNewApplicationPage />} />
          <Route path="applications/:id" element={<AdminApplicationDetailPage />} />
          <Route path="profile" element={<AdminMasterProfilePage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
