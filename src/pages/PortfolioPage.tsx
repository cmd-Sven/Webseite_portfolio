import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, MousePointer } from 'lucide-react'
import { useVerticalScrollFlow } from '../hooks/useVerticalScrollFlow'
import { NAV_SECTIONS } from '../data/navigation'
import { AnimatedGradientBackground } from '../components/AnimatedGradientBackground'
import { ViewportSwitcher } from '../components/ViewportSwitcher'
import { ViewportProvider } from '../context/ViewportContext'
import type { BlogPost } from '../types/blog'
import type { CaseStudy } from '../types/portfolio'
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
  const isVerticalFlow = useVerticalScrollFlow()
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [selectedProject, setSelectedProject] = useState<CaseStudy | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({ left: 0, top: 0 })
  }, [isVerticalFlow])

  useEffect(() => {
    if (isVerticalFlow) return

    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        container.scrollBy({
          left: e.deltaY * 1.2,
          behavior: 'auto',
        })
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [isVerticalFlow])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollSections = container.querySelectorAll<HTMLElement>('.scroll-section')

    if (isVerticalFlow) {
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
            sec.style.setProperty(
              '--section-progress',
              String(Math.min(1, ratio * 1.5)),
            )
          } else if (ratio < 0.02) {
            sec.classList.remove('section-in-view')
            sec.style.setProperty('--section-progress', '0')
          }

          if (probe >= top && probe < bottom) {
            activeId = sec.id
          } else {
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
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let bestId = ''
        let bestRatio = 0

        entries.forEach((entry) => {
          const section = entry.target as HTMLElement
          const ratio = entry.intersectionRatio

          section.style.setProperty('--section-progress', String(ratio))

          if (ratio >= 0.28) {
            section.classList.add('section-in-view')
          } else if (ratio < 0.12) {
            section.classList.remove('section-in-view')
            section.style.setProperty('--section-progress', '0')
          }

          if (entry.isIntersecting && ratio > bestRatio) {
            bestRatio = ratio
            bestId = section.id
          }
        })

        if (bestRatio >= 0.35) {
          setActiveSection(bestId)
        }
      },
      {
        root: container,
        rootMargin: '0px',
        threshold: [0, 0.12, 0.28, 0.35, 0.5, 0.65, 0.85, 1],
      },
    )

    scrollSections.forEach((sec) => observer.observe(sec))
    scrollSections.forEach((sec) => {
      if (sec.id === 'hero') {
        sec.classList.add('section-in-view')
        sec.style.setProperty('--section-progress', '1')
      }
    })

    return () => scrollSections.forEach((sec) => observer.unobserve(sec))
  }, [isVerticalFlow])

  const scrollToSection = (id: string) => {
    const container = containerRef.current
    if (!container) return

    const element = container.querySelector<HTMLElement>(`#${id}`)
    if (!element) return

    if (isVerticalFlow) {
      container.scrollTo({
        top: Math.max(0, element.offsetTop - 6),
        behavior: 'smooth',
      })
    } else {
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const targetLeft = container.scrollLeft + (elementRect.left - containerRect.left)
      container.scrollTo({ left: targetLeft, behavior: 'smooth' })
    }
    setActiveSection(id)
  }

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash || !NAV_SECTIONS.some((sec) => sec.id === hash)) return

    const timer = window.setTimeout(() => scrollToSection(hash), 200)
    return () => window.clearTimeout(timer)
  }, [isVerticalFlow])

  return (
    <div className="viewport-studio w-full">
      <div
        ref={frameRef}
        className={`viewport-device__frame ${isVerticalFlow ? 'viewport-device__frame--vertical-flow' : ''}`}
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
                {isVerticalFlow ? (
                  <div className="scroll-hint scroll-hint--vertical flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800 max-w-[9rem]">
                    <ArrowDown className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Vertikal scrollen</span>
                  </div>
                ) : (
                  <div className="scroll-hint scroll-hint--horizontal hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-4 py-2 rounded-full border border-slate-800">
                    <MousePointer className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                    <span>Mausrad / Wischen</span>
                  </div>
                )}
              </div>
            </header>

            <nav
              aria-label="Sektionsnavigation"
              className="viewport-chrome-nav section-nav flex flex-col items-center gap-3 bg-slate-900/40 p-2.5 rounded-full border border-white/5 backdrop-blur-md max-h-[min(60vh,480px)] overflow-y-auto overflow-x-hidden scrollbar-thin"
            >
              {NAV_SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className="group relative flex items-center justify-center w-8 h-8 focus:outline-none"
                    aria-label={`Scrollen zu ${sec.title}`}
                  >
                    <span className="nav-tooltip absolute right-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-slate-200 text-[10px] uppercase tracking-widest font-bold py-1.5 px-3 rounded-md shadow-lg border border-slate-800 whitespace-nowrap">
                      {sec.title}
                    </span>
                    <span
                      className={`nav-dot w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'nav-dot--active bg-gradient-to-tr from-cyan-400 to-violet-500 scale-125 shadow-lg shadow-cyan-500/40'
                          : 'bg-slate-700 hover:bg-slate-500 hover:scale-110'
                      }`}
                    />
                  </button>
                )
              })}
            </nav>

            <div
              ref={containerRef}
              className={`horizontal-scroll-container scrollbar-thin scrollbar-track-transparent ${
                isVerticalFlow ? 'horizontal-scroll-container--vertical-flow' : ''
              }`}
            >
              <HeroSection onScrollTo={scrollToSection} onOpenBlogPost={setSelectedBlogPost} />
              <AboutSection onScrollTo={scrollToSection} />
              <ExpertiseSection onScrollTo={scrollToSection} />
              <TechStackSection onScrollTo={scrollToSection} />
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
