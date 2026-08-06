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

          <RevealGroup
            grid
            className="techstack-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch min-w-0"
          >
            {TECH_STACK_DATA.map((group, idx) => (
              <div key={idx} className="techstack-card-slot">
                <PortfolioCard
                  glow="card-glow--cyan-violet"
                  hover="cyan"
                  className="portfolio-card--compact h-full flex flex-col"
                >
                  <h3 className="techstack-category-heading text-[11px] font-mono text-cyan-400 font-bold mb-3 tracking-wide uppercase flex items-center gap-1.5 shrink-0">
                    <Cpu className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="leading-snug">{group.category}</span>
                  </h3>

                  <div
                    className={`techstack-tools-grid flex-1 ${
                      group.tools.length === 5 ? 'techstack-tools-grid--count-5' : ''
                    }`}
                  >
                    {group.tools.map((tool, tIdx) => (
                      <div
                        key={tIdx}
                        className="techstack-tool-cell flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-center"
                      >
                        <div className="techstack-tool-icon w-9 h-9 rounded-md flex items-center justify-center shrink-0 p-1">
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
                        <span className="techstack-tool-label text-[9px] text-slate-200 font-medium leading-tight line-clamp-2">
                          {tool.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </PortfolioCard>
              </div>
            ))}
          </RevealGroup>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
