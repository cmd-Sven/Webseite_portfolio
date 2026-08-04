import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, Lock } from 'lucide-react'
import { NAV_SECTIONS } from '../data/navigation'
import { AnimatedGradientBackground } from '../components/AnimatedGradientBackground'
import { SectionNav } from '../components/SectionNav'
import { ViewportSwitcher } from '../components/ViewportSwitcher'
import { ViewportProvider } from '../context/ViewportContext'
import { useAuth } from '../context/AuthContext'
import type { BlogPost } from '../types/blog'
import type { CaseStudy } from '../types/portfolio'
import { AdminLoginModal } from '../components/AdminLoginModal'
import { BlogPostModal } from '../components/BlogPostModal'
import { ProjectDetailModal } from '../components/ProjectDetailModal'
import { HeroSection } from '../sections/HeroSection'
import { AboutSection } from '../sections/AboutSection'
import { BlogSection } from '../sections/BlogSection'
import { ExpertiseSection } from '../sections/ExpertiseSection'
import { TechStackSection } from '../sections/TechStackSection'
import { DashboardSection } from '../sections/DashboardSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { ContactSection } from '../sections/ContactSection'
import { ThemeSwitcher } from '../components/ThemeSwitcher'

function PortfolioPageContent() {
  const frameRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { isAdmin, isMonitor, homePath } = useAuth()
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [selectedProject, setSelectedProject] = useState<CaseStudy | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)

  const handleAdminClick = () => {
    if (isAdmin || isMonitor) {
      navigate(homePath)
      return
    }
    setAdminLoginOpen(true)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollSections = container.querySelectorAll<HTMLElement>('.scroll-section')

    const syncVerticalScroll = () => {
      const scrollTop = container.scrollTop
      const viewportBottom = scrollTop + container.clientHeight
      const probe = scrollTop + container.clientHeight * 0.3

      let activeId = 'hero'
      let nearestDist = Number.POSITIVE_INFINITY

      scrollSections.forEach((sec) => {
        const top = sec.offsetTop
        const bottom = top + sec.offsetHeight
        const visible =
          Math.min(bottom, viewportBottom) - Math.max(top, scrollTop)
        const ratio = visible / Math.max(sec.offsetHeight, 1)

        if (ratio > 0.06) {
          sec.classList.add('section-in-view')
        } else if (ratio < 0.02) {
          sec.classList.remove('section-in-view')
        }

        if (probe >= top && probe < bottom) {
          activeId = sec.id
          nearestDist = 0
        } else if (nearestDist > 0) {
          const dist = probe < top ? top - probe : probe - bottom
          if (dist < nearestDist) {
            nearestDist = dist
            activeId = sec.id
          }
        }
      })

      setActiveSection(activeId)
    }

    syncVerticalScroll()
    container.addEventListener('scroll', syncVerticalScroll, { passive: true })
    window.addEventListener('resize', syncVerticalScroll)
    return () => {
      container.removeEventListener('scroll', syncVerticalScroll)
      window.removeEventListener('resize', syncVerticalScroll)
    }
  }, [])

  const scrollToSection = (id: string) => {
    const container = containerRef.current
    if (!container) return

    const element = container.querySelector<HTMLElement>(`#${id}`)
    if (!element) return

    container.scrollTo({
      top: Math.max(0, element.offsetTop - 6),
      behavior: 'smooth',
    })
    setActiveSection(id)
  }

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash || !NAV_SECTIONS.some((sec) => sec.id === hash)) return

    const timer = window.setTimeout(() => scrollToSection(hash), 200)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="viewport-studio w-full">
      <div
        ref={frameRef}
        className="viewport-device__frame viewport-device__frame--vertical-flow"
      >
        <div className="portfolio-page relative isolate h-full overflow-hidden text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
          <AnimatedGradientBackground activeSection={activeSection} />

          <div className="relative z-10 h-full">
            <header className="viewport-chrome-header px-4 md:px-8 lg:px-12 py-4 md:py-6 flex justify-between items-center gap-2 bg-gradient-to-b from-slate-950/80 to-transparent backdrop-blur-sm">
              <div
                className="flex items-center gap-2 cursor-pointer shrink-0 min-w-0"
                onClick={() => scrollToSection('hero')}
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-cyan-500/10 shrink-0">
                  S
                </div>
                <div className="min-w-0">
                  <span className="heading-section font-extrabold tracking-wider text-xs md:text-sm block truncate">
                    SVEN SIEBER
                  </span>
                  <span className="brand-subtitle text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                    Data and Frontend Engineer
                  </span>
                </div>
              </div>

              <div className="header-controls flex items-center gap-2 md:gap-3 shrink-0">
                <ViewportSwitcher compact />
                <ThemeSwitcher compact />
                <button
                  type="button"
                  onClick={handleAdminClick}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[9px] md:text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700/70 transition-colors"
                  aria-label={
                    isAdmin
                      ? 'Zum Admin-Dashboard'
                      : isMonitor
                        ? 'Zum Monitor'
                        : 'ATS-Login öffnen'
                  }
                  title={
                    isAdmin ? 'Admin-Dashboard' : isMonitor ? 'Monitor' : 'ATS-Login'
                  }
                >
                  <Lock className="w-3 h-3 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Admin</span>
                </button>
                <div className="scroll-hint scroll-hint--vertical hidden md:flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
                  <ArrowDown className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Nach unten scrollen</span>
                </div>
              </div>
            </header>

            <SectionNav activeSection={activeSection} onNavigate={scrollToSection} />

            <div
              ref={containerRef}
              className="horizontal-scroll-container horizontal-scroll-container--vertical-flow scrollbar-thin scrollbar-track-transparent"
            >
              <HeroSection onScrollTo={scrollToSection} onOpenBlogPost={setSelectedBlogPost} />
              <AboutSection />
              <ExpertiseSection />
              <TechStackSection />
              <DashboardSection />
              <ProjectsSection onSelectProject={setSelectedProject} />
              <BlogSection onSelectPost={setSelectedBlogPost} />
              <ContactSection />
            </div>

            {selectedProject && (
              <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
            )}

            {selectedBlogPost && (
              <BlogPostModal post={selectedBlogPost} onClose={() => setSelectedBlogPost(null)} />
            )}

            {adminLoginOpen && (
              <AdminLoginModal onClose={() => setAdminLoginOpen(false)} />
            )}

            <footer className="viewport-chrome-footer px-4 md:px-8 lg:px-12 py-3 md:py-4 flex justify-between items-center gap-2 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none">
              <span className="text-[9px] md:text-[10px] text-slate-500 font-mono truncate">
                © 2026 Sven Sieber
              </span>
              <div className="flex gap-3 md:gap-4 pointer-events-auto shrink-0">
                <Link
                  to="/impressum"
                  className="text-[9px] md:text-[10px] text-slate-500 hover:text-cyan-400 font-mono transition-colors"
                >
                  Impressum
                </Link>
                <Link
                  to="/datenschutz"
                  className="text-[9px] md:text-[10px] text-slate-500 hover:text-cyan-400 font-mono transition-colors"
                >
                  Datenschutz
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PortfolioPage() {
  return (
    <ViewportProvider>
      <PortfolioPageContent />
    </ViewportProvider>
  )
}
