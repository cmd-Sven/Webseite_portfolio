import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'
import { DashboardDemos } from '../components/DashboardDemos'

export function DashboardSection() {
  return (
    <section
      id="dashboard"
      className="scroll-section section-shell scroll-section--dashboard flex items-center justify-center"
    >
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col min-h-0 justify-center">
        <RevealGroup className="flex flex-col gap-6 min-h-0 w-full max-w-2xl">
          <SectionHeader
            eyebrow="Live Demo"
            title="Analytics zum Anfassen"
            lead="Daten sagen mir erst dann etwas, wenn ich sie bewegen kann. Deshalb habe ich eine interaktive Demo gebaut: Vue-Slider steuern Traffic, Conversion und UX-Lift – die SVG-Charts reagieren live. So wird aus Parameter-Tweaks sofort sichtbar, wo Wochenverlauf, Funnel und Performance sich verschieben."
            accent="cyan"
          />
          <DashboardDemos />
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
