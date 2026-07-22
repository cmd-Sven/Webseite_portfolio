import { ArrowRight } from 'lucide-react'
import { CASE_STUDIES, getProjectGlowClass, getProjectHeaderGradient } from '../data/caseStudies'
import { PortfolioCard } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { PORTFOLIO_CARD_SM } from '../lib/portfolioCard'
import type { CaseStudy } from '../types/portfolio'

interface ProjectsSectionProps {
  onSelectProject: (project: CaseStudy) => void
}

export function ProjectsSection({ onSelectProject }: ProjectsSectionProps) {
  return (
    <section id="projects" className="scroll-section flex items-center justify-center px-6 md:px-12 py-16">
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col h-full justify-center">
        <RevealGroup className="flex flex-col space-y-8">
        <div>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
            Praxis & Proof of Skills
          </span>
          <h2 className="heading-section section-heading-xl text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
            Ausgewählte Case Studies
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Klicke auf eine Karte, um den detaillierten Projekt-Workflow (STAR-Methodik) zu sehen.
          </p>
        </div>

        <RevealGroup grid className="projects-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          {CASE_STUDIES.map((project) => (
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
                className="p-0 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`heading-on-media relative h-36 bg-gradient-to-br ${getProjectHeaderGradient(project.id)} to-slate-900 flex items-center justify-center p-6 border-b border-slate-800 overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-[#090a0f] opacity-40 mix-blend-multiply" />
                    <div className="z-10 text-center space-y-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest text-slate-950 bg-gradient-to-r ${project.badgeColor}`}
                      >
                        {project.badge}
                      </span>
                      <h4 className="text-xl font-bold font-mono tracking-tight text-white group-hover:scale-105 transition-transform">
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
                    <span>Case Study lesen</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
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
