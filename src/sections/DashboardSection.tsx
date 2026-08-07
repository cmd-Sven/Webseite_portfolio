// Charts zum Anfassen — Zahlen ohne Beamer-Schweiß und „noch eine Folie“.
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'
import { BlogTermHint } from '../components/BlogTermHint'
import { DashboardDemos } from '../components/DashboardDemos'
import { AnalyticsDemoVisual } from '../components/analytics/AnalyticsDemoVisual'

export function DashboardSection() {
  return (
    <section
      id="dashboard"
      className="scroll-section section-shell scroll-section--dashboard flex items-center justify-center"
    >
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col min-h-0 justify-center min-w-0">
        <RevealGroup className="dashboard-columns grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,380px)] gap-6 sm:gap-8 lg:gap-10 items-center w-full min-w-0">
          <div className="flex flex-col gap-5 sm:gap-6 min-h-0 w-full max-w-2xl lg:max-w-none min-w-0">
            <SectionHeader
              eyebrow="Live Demos"
              title="Analytics zum Anfassen"
              lead={
                <>
                  Daten sagen mir erst dann etwas, wenn ich sie bewegen kann. Drei interaktive Demos:{' '}
                  <BlogTermHint termKey="Conversion" />
                  /UX-Lift mit live gekoppelten Charts, ein Simulator für{' '}
                  <BlogTermHint termKey="A/B-Test">A/B-Tests</BlogTermHint> mit{' '}
                  <BlogTermHint termKey="Chi-Quadrat" /> – und Performance &amp; Speed-Impact mit
                  Bounce-Kurve.
                </>
              }
              accent="cyan"
            />
            <DashboardDemos />
          </div>

          <aside
            className="dashboard-columns__preview flex flex-col items-center lg:items-end justify-center w-full min-w-0 max-w-full overflow-hidden"
            aria-hidden="true"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 sm:mb-4 text-center lg:text-right w-full max-w-[min(100%,380px)]">
              Dashboard Preview
            </p>
            <AnalyticsDemoVisual />
          </aside>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
