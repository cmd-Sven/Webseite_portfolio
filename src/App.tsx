import { Routes, Route } from 'react-router-dom'
import { PortfolioPage } from './pages/PortfolioPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { DatenschutzPage } from './pages/DatenschutzPage'
import { AnalyticsPage, AnalyticsMetricRedirect } from './pages/AnalyticsPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/analytics/:metricId" element={<AnalyticsMetricRedirect />} />
      <Route path="/impressum" element={<ImpressumPage />} />
      <Route path="/datenschutz" element={<DatenschutzPage />} />
    </Routes>
  )
}

export default App
