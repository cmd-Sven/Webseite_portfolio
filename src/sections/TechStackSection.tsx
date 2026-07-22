import { ArrowRight, Cpu } from 'lucide-react'
import { PortfolioCard } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { TECH_STACK_DATA } from '../data/techStack'

interface TechStackSectionProps {
  onScrollTo: (id: string) => void
}

export function TechStackSection({ onScrollTo }: TechStackSectionProps) {
  return (
    <section
      id="techstack"
      className="scroll-section scroll-section--techstack flex items-center justify-center px-5 md:px-10 py-16"
    >
      <SectionRevealLayer className="techstack-inner w-full max-w-6xl flex flex-col gap-3">
        <RevealGroup className="flex flex-col gap-3">
        <div className="shrink-0">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
            Toolbox & Technologien
          </span>
          <h2 className="heading-section text-2xl md:text-3xl font-extrabold tracking-tight mt-0.5">
            Software & Stack
          </h2>
        </div>

        <RevealGroup grid className="techstack-grid grid grid-cols-3 gap-2 sm:gap-3 min-w-0">
          {TECH_STACK_DATA.map((group, idx) => (
            <PortfolioCard
              key={idx}
              glow="card-glow--cyan-violet"
              hover="cyan"
              className="portfolio-card--compact"
            >
              <h3 className="text-[10px] font-mono text-cyan-400 font-bold mb-2 tracking-wide uppercase pb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-violet-400 shrink-0" />
                <span className="leading-tight">{group.category}</span>
              </h3>

              <div className="grid grid-cols-3 gap-1.5">
                {group.tools.map((tool, tIdx) => (
                  <div
                    key={tIdx}
                    className="techstack-tool-cell flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-center"
                  >
                    <div className="techstack-tool-icon w-8 h-8 rounded-md flex items-center justify-center shrink-0 p-1">
                      <img
                        src={tool.img}
                        alt={`${tool.name} Icon`}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-200 font-medium leading-tight line-clamp-2">
                      {tool.name}
                    </span>
                  </div>
                ))}
              </div>
            </PortfolioCard>
          ))}
        </RevealGroup>

        <div className="shrink-0 flex justify-end pt-1">
          <button
            onClick={() => onScrollTo('dashboard')}
            className="btn btn-sm btn-ghost gap-2 text-slate-400 hover:text-white min-h-8 h-8"
          >
            <span className="text-xs">Nächste Sektion: Live-Demos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
