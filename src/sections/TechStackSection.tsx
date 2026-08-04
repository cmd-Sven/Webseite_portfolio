import { Cpu } from 'lucide-react'
import { PortfolioCard } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'
import { TECH_STACK_DATA } from '../data/techStack'

export function TechStackSection() {
  return (
    <section
      id="techstack"
      className="scroll-section section-shell scroll-section--techstack flex items-center justify-center"
    >
      <SectionRevealLayer className="techstack-inner w-full max-w-6xl flex flex-col gap-6">
        <RevealGroup className="flex flex-col gap-6">
          <SectionHeader eyebrow="Toolbox & Technologien" title="Software & Stack" accent="cyan" />

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
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
