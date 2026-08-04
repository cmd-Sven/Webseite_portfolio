import { ArrowRight, ExternalLink } from 'lucide-react'
import { CASE_STUDIES, getProjectGlowClass, getProjectHeaderGradient } from '../data/caseStudies'
import { PortfolioCard } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'
import { PORTFOLIO_CARD_SM } from '../lib/portfolioCard'
import type { CaseStudy } from '../types/portfolio'

interface ProjectsSectionProps {
  onSelectProject: (project: CaseStudy) => void
}

export function ProjectsSection({ onSelectProject }: ProjectsSectionProps) {
  return (
    <section id="projects" className="scroll-section section-shell flex items-center justify-center">
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col h-full justify-center">
        <RevealGroup className="flex flex-col gap-6">
          <SectionHeader
            eyebrow="Praxis & Proof of Skills"
            title="Projekte & Case Studies"
            lead="Ein aktives Produkt und drei Case Studies – Ziel, Techniken und Transfer auf größere Vorhaben."
            accent="cyan"
          />

          <RevealGroup grid className="projects-grid grid grid-cols-1 md:grid-cols-2 gap-5">
            {CASE_STUDIES.map((project) => {
              const isLiveProject = project.kind === 'project'
              return (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectProject(project)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectProject(project)}
                  className="cursor-pointer group"
                >
                  <PortfolioCard
                    glow={getProjectGlowClass(project.id)}
                    hover="cyan"
                    className="p-0 overflow-hidden flex flex-col justify-between h-full"
                  >
                    <div>
                      <div
                        className={`heading-on-media relative h-36 bg-gradient-to-br ${getProjectHeaderGradient(project.id)} to-slate-900 flex items-center justify-center border-b border-slate-800 overflow-hidden`}
                      >
                        {project.mockupImg ? (
                          <img
                            src={project.mockupImg}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover object-top opacity-70 group-hover:opacity-85 group-hover:scale-[1.03] transition-all duration-500"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/50 to-transparent" />
                        <div className="z-10 text-center space-y-2 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest text-slate-950 bg-gradient-to-r ${project.badgeColor}`}
                          >
                            {project.badge}
                          </span>
                          <h4 className="text-xl font-bold font-mono tracking-tight text-white drop-shadow">
                            {project.title}
                          </h4>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <h3 className="heading-section text-base font-bold">{project.subtitle}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{project.teaser}</p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tags.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className={`${PORTFOLIO_CARD_SM} inline-block px-2 py-1 text-slate-400 text-[10px] font-mono`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>{isLiveProject ? 'Projekt ansehen' : 'Case Study lesen'}</span>
                        {isLiveProject ? <ExternalLink className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                      </div>
                    </div>
                  </PortfolioCard>
                </div>
              )
            })}
          </RevealGroup>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
