import { PortfolioCard } from './PortfolioCard'
import type { CaseStudy } from '../types/portfolio'

interface ProjectDetailModalProps {
  project: CaseStudy
  onClose: () => void
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const isLiveProject = project.kind === 'project'

  return (
    <div
      className="viewport-modal-overlay flex items-center justify-center p-4 md:p-10 backdrop-blur-xl bg-slate-950/80 animate-fadeIn pointer-events-auto"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="max-w-4xl w-full">
        <PortfolioCard
          glow="card-glow--cyan-violet card-glow--slow"
          hover="cyan"
          className="relative !rounded-3xl max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 text-left scrollbar-thin"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#14161c] border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors z-10"
            aria-label="Modal schließen"
          >
            ✕
          </button>

          <div className="border-b border-slate-800 pb-4 pr-10">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest text-slate-950 bg-gradient-to-r ${project.badgeColor} mb-2`}
            >
              {project.badge}
            </span>
            <h2 className="heading-section text-2xl md:text-3xl font-black tracking-tight">{project.subtitle}</h2>
            <p className="text-xs text-cyan-400 font-mono mt-1">
              {isLiveProject ? 'Aktives Produkt' : 'Case Study'} // {project.title}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <div>
                <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  01. Ziel
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">{project.goal}</p>
              </div>
              <div>
                <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  02. Techniken & Vorgehen
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">{project.techniques}</p>
              </div>
              <div>
                <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  03. Transfer
                </h4>
                <p className="text-xs text-emerald-300/90 font-medium leading-relaxed mt-1">
                  {project.transfer}
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
              <div className="w-full h-44 rounded-xl bg-[#0a0b10] border border-slate-800 flex flex-col items-center justify-center overflow-hidden relative group">
                {project.mockupImg && (
                  <img
                    src={project.mockupImg}
                    alt={`${project.title} Vorschaubild`}
                    className="w-full h-full object-cover object-top filter brightness-90 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                  Genutzte Technologien
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-[#0a0b10] text-slate-300 border border-slate-800 text-[10px] font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm w-full bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 border-0 normal-case font-mono text-[11px] rounded-xl flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Live-Website öffnen
                  </a>
                )}
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm w-full bg-[#14161c] hover:bg-[#1c1f28] text-slate-200 border border-slate-700 normal-case font-mono text-[11px] rounded-xl flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  Code auf GitHub ansehen
                </a>
                {project.figmaUrl && (
                  <a
                    href={project.figmaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm w-full bg-[#14161c] hover:bg-[#1c1f28] text-slate-200 border border-slate-700 normal-case font-mono text-[11px] rounded-xl flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Figma Prototyp öffnen
                  </a>
                )}
              </div>
            </div>
          </div>
        </PortfolioCard>
      </div>
    </div>
  )
}
