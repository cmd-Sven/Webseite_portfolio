import { ArrowRight, BarChart3, Code, Compass, Paintbrush } from 'lucide-react'
import { PortfolioCard } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'

interface ExpertiseSectionProps {
  onScrollTo: (id: string) => void
}

export function ExpertiseSection({ onScrollTo }: ExpertiseSectionProps) {
  return (
    <section id="expertise" className="scroll-section flex items-center justify-center px-6 md:px-12 py-16">
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col h-full justify-center">
        <RevealGroup className="flex flex-col space-y-6">
        <div>
          <span className="text-xs font-mono text-violet-400 uppercase tracking-widest">
            Synergie aus Design, Code & Data
          </span>
          <h2 className="heading-display section-heading-xl text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
            Mein T-Shaped Profil
          </h2>
        </div>

        <RevealGroup grid className="expertise-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          <PortfolioCard glow="card-glow--emerald-cyan" hover="emerald" className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#14161c] border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="heading-section text-lg font-bold mb-2">Datenanalyse</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A/B-Testing, Funnel-Analysen und datenbasierte Conversion-Optimierung. (Aktuell in
                fortgeschrittener Spezialisierung).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-emerald-400 flex justify-between">
              <span>Python / SQL</span>
              <span>Tableau / BI</span>
            </div>
          </PortfolioCard>

          <PortfolioCard glow="card-glow--violet-cyan" hover="violet" className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#14161c] border border-violet-800/50 flex items-center justify-center text-violet-400 mb-4">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="heading-section text-lg font-bold mb-2">Webentwicklung</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Performante SPAs und Architekturen. Sicher in React + TS, Vue 3 und Utility-First CSS
                (Tailwind). Sauberer, wartbarer Code.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-violet-400 flex justify-between">
              <span>React & Vue</span>
              <span>TypeScript</span>
            </div>
          </PortfolioCard>

          <PortfolioCard glow="card-glow--cyan-violet" hover="cyan" className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#14161c] border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="heading-section text-lg font-bold mb-2">UI/UX-Gesetze</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Konzeption nach psychologischen UI-Gesetzen (Fitts', Hick's Law). Fokus auf intuitive
                User Journeys und Barrierefreiheit (WCAG).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-cyan-400 flex justify-between">
              <span>Figma / Concepts</span>
              <span>Accessibility</span>
            </div>
          </PortfolioCard>

          <PortfolioCard glow="card-glow--cyan-teal card-glow--slow" hover="cyan" className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#14161c] border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-4">
                <Paintbrush className="w-6 h-6" />
              </div>
              <h3 className="heading-section text-lg font-bold mb-2">Mediengestaltung</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mein kreatives Fundament. Visuelles Storytelling, Typografie und Corporate Identity für
                digitale und analoge Touchpoints.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-cyan-400 flex justify-between">
              <span>Corporate Design</span>
              <span>Digital Branding</span>
            </div>
          </PortfolioCard>
        </RevealGroup>

        <div className="flex justify-end">
          <button
            onClick={() => onScrollTo('techstack')}
            className="btn btn-sm btn-ghost gap-2 text-slate-400 hover:text-white"
          >
            <span>Nächste Sektion: Tools & Frameworks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
