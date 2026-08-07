import { DemoPageLayout } from '../components/demo/DemoPageLayout'
import PerformanceSimulatorPlayground from '../components/PerformanceSimulatorPlayground'
import { PERFORMANCE_DEMO_GLOSSARY } from '../data/demoGlossary'

export function PerformancePage() {
  return (
    <DemoPageLayout
      activeDemo="performance"
      title="Performance & Speed-Impact"
      subtitle="Bundle-Größe, Latenz und Bildoptimierung live gegen Lighthouse-Score, Ladezeit und Bounce-Rate stellen — Tech-Entscheidungen als Business-KPI."
      chartLabel="Speed Impact"
      glossary={PERFORMANCE_DEMO_GLOSSARY}
      glossaryTitle="Legende · Performance"
    >
      <div className="max-w-4xl mx-auto">
        <PerformanceSimulatorPlayground />
      </div>
    </DemoPageLayout>
  )
}
