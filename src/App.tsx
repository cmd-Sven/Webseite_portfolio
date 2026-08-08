import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { PortfolioPage } from './pages/PortfolioPage'
import { AtsBookmarkletReceiver } from './components/admin/AtsBookmarkletReceiver'
import { AtsCompanyBookmarkletReceiver } from './components/admin/AtsCompanyBookmarkletReceiver'
import { AtsPoolBookmarkletReceiver } from './components/admin/AtsPoolBookmarkletReceiver'
import { ProtectedRoute } from './components/admin/ProtectedRoute'

const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const AnalyticsLegacyRedirect = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({
    default: m.AnalyticsLegacyRedirect,
  })),
)
const AnalyticsMetricRedirect = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({
    default: m.AnalyticsMetricRedirect,
  })),
)
const ABTestPage = lazy(() =>
  import('./pages/ABTestPage').then((m) => ({ default: m.ABTestPage })),
)
const PerformancePage = lazy(() =>
  import('./pages/PerformancePage').then((m) => ({
    default: m.PerformancePage,
  })),
)
const ImpressumPage = lazy(() =>
  import('./pages/ImpressumPage').then((m) => ({ default: m.ImpressumPage })),
)
const DatenschutzPage = lazy(() =>
  import('./pages/DatenschutzPage').then((m) => ({
    default: m.DatenschutzPage,
  })),
)
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({
    default: m.AdminLoginPage,
  })),
)
const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({
    default: m.AdminLayout,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminNewApplicationPage = lazy(() =>
  import('./pages/admin/AdminNewApplicationPage').then((m) => ({
    default: m.AdminNewApplicationPage,
  })),
)
const AdminApplicationDetailPage = lazy(() =>
  import('./pages/admin/AdminApplicationDetailPage').then((m) => ({
    default: m.AdminApplicationDetailPage,
  })),
)
const AdminMasterProfilePage = lazy(() =>
  import('./pages/admin/AdminMasterProfilePage').then((m) => ({
    default: m.AdminMasterProfilePage,
  })),
)
const AdminJobPoolPage = lazy(() =>
  import('./pages/admin/AdminJobPoolPage').then((m) => ({
    default: m.AdminJobPoolPage,
  })),
)
const AdminPlanPage = lazy(() =>
  import('./pages/admin/AdminPlanPage').then((m) => ({
    default: m.AdminPlanPage,
  })),
)
const AdminCompaniesPage = lazy(() =>
  import('./pages/admin/AdminCompaniesPage').then((m) => ({
    default: m.AdminCompaniesPage,
  })),
)
const MonitorPage = lazy(() =>
  import('./pages/monitor/MonitorPage').then((m) => ({
    default: m.MonitorPage,
  })),
)

function RouteFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      aria-busy="true"
      aria-label="Seite wird geladen"
    >
      <span className="inline-block size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
    </div>
  )
}

export function App() {
  return (
    <>
      <AtsBookmarkletReceiver />
      <AtsPoolBookmarkletReceiver />
      <AtsCompanyBookmarkletReceiver />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<PortfolioPage />} />
          <Route path="/demo/analytics" element={<AnalyticsPage />} />
          <Route path="/demo/ab-test" element={<ABTestPage />} />
          <Route path="/demo/performance" element={<PerformancePage />} />
          <Route path="/analytics" element={<AnalyticsLegacyRedirect />} />
          <Route
            path="/analytics/:metricId"
            element={<AnalyticsMetricRedirect />}
          />
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
            <Route
              path="applications/:id"
              element={<AdminApplicationDetailPage />}
            />
            <Route path="profile" element={<AdminMasterProfilePage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App
