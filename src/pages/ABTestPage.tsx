import { DemoPageLayout } from '../components/demo/DemoPageLayout'
import ABTestSimulatorPlayground from '../components/ABTestSimulatorPlayground'
import { AB_TEST_DEMO_GLOSSARY } from '../data/demoGlossary'

export function ABTestPage() {
  return (
    <DemoPageLayout
      activeDemo="ab-test"
      title="A/B-Test Simulator"
      subtitle="Zwei CTA-Varianten, 10 Sekunden Traffic-Stream, danach Chi-Quadrat-Auswertung mit Sparklines — als Vue-Island in React."
      chartLabel="Experiment"
      glossary={AB_TEST_DEMO_GLOSSARY}
      glossaryTitle="Legende · A/B-Test"
    >
      <div className="max-w-3xl mx-auto">
        <ABTestSimulatorPlayground />
      </div>
    </DemoPageLayout>
  )
}
