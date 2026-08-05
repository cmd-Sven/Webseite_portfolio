import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'
import { DashboardDemos } from '../components/DashboardDemos'
import { AnalyticsDemoVisual } from '../components/analytics/AnalyticsDemoVisual'

export function DashboardSection() {
  return (
    <section
      id="dashboard"
      className="scroll-section section-shell scroll-section--dashboard flex items-center justify-center"
    >
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col min-h-0 justify-center">
        <RevealGroup className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,340px)] gap-8 lg:gap-10 items-center w-full">
          <div className="flex flex-col gap-6 min-h-0 w-full max-w-2xl lg:max-w-none">
            <SectionHeader
              eyebrow="Live Demo"
              title="Analytics zum Anfassen"
              lead="Daten sagen mir erst dann etwas, wenn ich sie bewegen kann. Deshalb habe ich eine interaktive Demo gebaut: Vue-Slider steuern Traffic, Conversion und UX-Lift – die SVG-Charts reagieren live. So wird aus Parameter-Tweaks sofort sichtbar, wo Wochenverlauf, Funnel und Performance sich verschieben."
              accent="cyan"
            />
            <DashboardDemos />
          </div>

          <aside className="flex flex-col items-center lg:items-end justify-center" aria-hidden="true">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4 text-center lg:text-right w-full max-w-[340px]">
              Dashboard Preview
            </p>
            <AnalyticsDemoVisual />
          </aside>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
