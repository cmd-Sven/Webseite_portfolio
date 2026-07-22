import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { DashboardDemos } from '../components/DashboardDemos'

export function DashboardSection() {
  return (
    <section
      id="dashboard"
      className="scroll-section scroll-section--dashboard flex items-center justify-center px-6 md:px-12 py-12 md:py-16"
    >
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col min-h-0 justify-center">
        <RevealGroup className="flex flex-col min-h-0 w-full max-w-2xl mx-auto lg:mx-0">
          <div className="shrink-0 mb-4 md:mb-6">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              Live Demos
            </span>
            <h2 className="heading-section section-heading-xl text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
              Analytics & Framework-Interop
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Interaktive Analysen und Vue-Steuerung auf einer eigenen, vertikal scrollbaren Seite.
            </p>
          </div>
          <DashboardDemos />
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
