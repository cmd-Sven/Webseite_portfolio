import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, Lock } from 'lucide-react'
import { NAV_SECTIONS } from '../data/navigation'
import { AnimatedGradientBackground } from '../components/AnimatedGradientBackground'
import { SectionNav } from '../components/SectionNav'
import { ScrollToTopButton } from '../components/ScrollToTopButton'
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

type HeaderIntroPhase = 'video' | 'fading' | 'sliding' | 'nav'
type IntroKeywordSide = 'left' | 'right'

/** Logo-Video-Intro im Header — false = sofort sticky Nav (kein Banner, kein Slide-up). */
const INTRO_VIDEO_ENABLED = false

const INTRO_SEEN_KEY = 'sieber-intro-seen'

const INTRO_KEYWORDS = [
  'React',
  'TypeScript',
  'UX/UI',
  'Dashboards',
  'Performance',
  'CRO',
  'A/B Testing',
  'Supabase',
] as const

const INTRO_KEYWORD_MAX_PER_SIDE = 4
const INTRO_KEYWORD_SLOTS = [14, 34, 54, 74] as const
/** Horizontal-Slots je Seite: äußere Banner-Bereiche links/rechts vom Video */
const INTRO_KEYWORD_X_SLOTS = [4, 11, 18, 26] as const

type IntroKeywordParticle = {
  id: number
  text: string
  side: IntroKeywordSide
  top: number
  x: number
  visible: boolean
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function hasIntroBeenSeen(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // Private Mode / Quota — Intro kann dann erneut laufen
  }
}

function getInitialHeaderPhase(): HeaderIntroPhase {
  if (!INTRO_VIDEO_ENABLED) return 'nav'
  if (typeof window === 'undefined') return 'video'
  if (hasIntroBeenSeen() || prefersReducedMotion()) return 'nav'
  return 'video'
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pickIntroKeyword(
  activeTexts: Set<string>,
): (typeof INTRO_KEYWORDS)[number] {
  const free = INTRO_KEYWORDS.filter((k) => !activeTexts.has(k))
  const pool = free.length > 0 ? free : INTRO_KEYWORDS
  return pool[Math.floor(Math.random() * pool.length)]!
}

function PortfolioPageContent() {
  const frameRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const introHoldTimeoutRef = useRef<number | null>(null)
  const navigate = useNavigate()
  const { isAdmin, isMonitor, homePath } = useAuth()
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [selectedProject, setSelectedProject] = useState<CaseStudy | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [headerPhase, setHeaderPhase] = useState<HeaderIntroPhase>(getInitialHeaderPhase)
  const [skipNavReveal] = useState(
    () =>
      !INTRO_VIDEO_ENABLED || hasIntroBeenSeen() || prefersReducedMotion(),
  )
  const [introKeywords, setIntroKeywords] = useState<IntroKeywordParticle[]>([])

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
    let ticking = false

    const syncVerticalScroll = () => {
      const scrollTop = container.scrollTop
      const viewH = container.clientHeight
      const viewportBottom = scrollTop + viewH
      // Sehr früher Reveal: ~50% Viewport unter dem Fold — Animation fertig bevor Inhalt im Blick ist
      const enterLine = viewportBottom + viewH * 0.5
      const probe = scrollTop + viewH * 0.3

      let activeId = 'hero'
      let nearestDist = Number.POSITIVE_INFINITY

      scrollSections.forEach((sec) => {
        const top = sec.offsetTop
        const bottom = top + sec.offsetHeight

        // Hero / above-the-fold sofort; einmal sichtbar → bleibt sichtbar (kein Re-Hide)
        if (
          sec.id === 'hero' ||
          top < enterLine ||
          (top < viewportBottom && bottom > scrollTop)
        ) {
          sec.classList.add('section-in-view')
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

    const onScrollOrResize = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        syncVerticalScroll()
        ticking = false
      })
    }

    syncVerticalScroll()
    container.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      container.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
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

  const finishHeaderIntro = () => {
    setHeaderPhase((prev) => (prev === 'video' ? 'fading' : prev))
  }

  /** Letztes Frame 2s halten, danach Fade → Slide-up → Nav. */
  const scheduleFinishAfterHold = () => {
    if (introHoldTimeoutRef.current != null) return
    introHoldTimeoutRef.current = window.setTimeout(() => {
      introHoldTimeoutRef.current = null
      finishHeaderIntro()
    }, 2000)
  }

  useEffect(() => {
    if (!INTRO_VIDEO_ENABLED || headerPhase !== 'fading') return
    const timer = window.setTimeout(() => setHeaderPhase('sliding'), 420)
    return () => window.clearTimeout(timer)
  }, [headerPhase])

  useEffect(() => {
    if (!INTRO_VIDEO_ENABLED || headerPhase !== 'sliding') return
    const timer = window.setTimeout(() => setHeaderPhase('nav'), 580)
    return () => window.clearTimeout(timer)
  }, [headerPhase])

  useEffect(() => {
    if (!INTRO_VIDEO_ENABLED) return
    if (headerPhase === 'nav') markIntroSeen()
  }, [headerPhase])

  useEffect(() => {
    if (!INTRO_VIDEO_ENABLED) return
    if (prefersReducedMotion()) {
      setHeaderPhase('nav')
      return
    }
    if (headerPhase !== 'video') return

    const video = videoRef.current
    // Video + 2s Hold am Ende; etwas Puffer falls Autoplay/Laden stockt
    const failSafe = window.setTimeout(scheduleFinishAfterHold, 12000)

    if (video) {
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => finishHeaderIntro())
      }
    }

    return () => {
      window.clearTimeout(failSafe)
      if (introHoldTimeoutRef.current != null) {
        window.clearTimeout(introHoldTimeoutRef.current)
        introHoldTimeoutRef.current = null
      }
    }
  }, [headerPhase])

  /** Random Schlagwort-Overlay links/rechts über die volle Intro-Banner-Breite */
  useEffect(() => {
    if (!INTRO_VIDEO_ENABLED || headerPhase !== 'video' || prefersReducedMotion()) {
      setIntroKeywords([])
      return
    }

    let cancelled = false
    let nextId = 0
    const timers = new Set<number>()
    const FADE_MS = 420
    /** Live-Spiegel der aktiven Particles für Spawn-Entscheidungen außerhalb von setState */
    let live: IntroKeywordParticle[] = []

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id)
        fn()
      }, ms)
      timers.add(id)
    }

    const commit = (next: IntroKeywordParticle[]) => {
      live = next
      setIntroKeywords(next)
    }

    const spawnOnSide = (side: IntroKeywordSide) => {
      if (cancelled) return

      const onSide = live.filter((k) => k.side === side)
      if (onSide.length >= INTRO_KEYWORD_MAX_PER_SIDE) return

      const usedSlots = new Set(
        onSide.map((k) =>
          INTRO_KEYWORD_SLOTS.reduce((best, slot) =>
            Math.abs(slot - k.top) < Math.abs(best - k.top) ? slot : best,
          ),
        ),
      )
      const freeSlots = INTRO_KEYWORD_SLOTS.filter((slot) => !usedSlots.has(slot))
      if (freeSlots.length === 0) return

      const usedX = new Set(
        onSide.map((k) =>
          INTRO_KEYWORD_X_SLOTS.reduce((best, slot) =>
            Math.abs(slot - k.x) < Math.abs(best - k.x) ? slot : best,
          ),
        ),
      )
      const freeX = INTRO_KEYWORD_X_SLOTS.filter((slot) => !usedX.has(slot))
      const xSlot =
        freeX.length > 0
          ? freeX[Math.floor(Math.random() * freeX.length)]!
          : INTRO_KEYWORD_X_SLOTS[
              Math.floor(Math.random() * INTRO_KEYWORD_X_SLOTS.length)
            ]!

      const activeTexts = new Set(live.map((k) => k.text))
      const text = pickIntroKeyword(activeTexts)
      const slot = freeSlots[Math.floor(Math.random() * freeSlots.length)]!
      const id = ++nextId
      const top = slot + randBetween(-3, 3)
      const x = xSlot + randBetween(-1.5, 1.5)
      const staggerMs = randBetween(0, 280)
      const holdMs = randBetween(1200, 2100)

      commit([...live, { id, text, side, top, x, visible: false }])

      schedule(() => {
        if (cancelled) return
        commit(live.map((k) => (k.id === id ? { ...k, visible: true } : k)))
        schedule(() => {
          if (cancelled) return
          commit(live.map((k) => (k.id === id ? { ...k, visible: false } : k)))
          schedule(() => {
            if (cancelled) return
            commit(live.filter((k) => k.id !== id))
          }, FADE_MS)
        }, holdMs)
      }, staggerMs)
    }

    const loop = () => {
      if (cancelled) return
      const primary: IntroKeywordSide = Math.random() < 0.5 ? 'left' : 'right'
      spawnOnSide(primary)
      if (Math.random() < 0.65) {
        schedule(
          () => spawnOnSide(primary === 'left' ? 'right' : 'left'),
          randBetween(90, 420),
        )
      }
      schedule(loop, randBetween(320, 780))
    }

    schedule(loop, 380)

    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
      timers.clear()
      setIntroKeywords([])
    }
  }, [headerPhase])

  /* Nav schon unter dem Panel bereit, damit der Slide-up sie freigibt */
  const navReady = !INTRO_VIDEO_ENABLED || headerPhase !== 'video'
  const showIntro = INTRO_VIDEO_ENABLED && headerPhase !== 'nav'

  return (
    <div className="viewport-studio w-full">
      <div
        ref={frameRef}
        className="viewport-device__frame viewport-device__frame--vertical-flow"
      >
        <div className="portfolio-page relative isolate h-full overflow-hidden text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
          <AnimatedGradientBackground activeSection={activeSection} />

          <div className="relative z-10 h-full">
            {/* Sticky Nav — liegt unter dem Intro-Panel und wird nach Slide-up sichtbar */}
            <header
              className="viewport-chrome-header header-logo-intro px-4 md:px-8 lg:px-12 bg-gradient-to-b from-slate-950/80 to-transparent backdrop-blur-sm"
              data-intro={headerPhase}
            >
              <div
                className={`header-logo-intro__nav flex justify-between items-center gap-2${
                  navReady ? ' is-visible' : ''
                }`}
                aria-hidden={!navReady}
                {...(!navReady ? { inert: true } : {})}
              >
                <button
                  type="button"
                  className="flex items-center gap-2.5 md:gap-3 shrink-0 min-w-0 cursor-pointer bg-transparent border-0 p-0 text-left"
                  onClick={() => scrollToSection('hero')}
                  aria-label="Zum Hero scrollen"
                  tabIndex={navReady ? undefined : -1}
                >
                  {/* Fixed header: mark-only + text (BrandLogo/About unverändert) */}
                  <img
                    src="/logo-sieber-mark.webp?v=3"
                    alt=""
                    width={800}
                    height={568}
                    decoding="async"
                    className="brand-logo h-14 w-auto max-w-[4.55rem] object-contain object-center shrink-0"
                    aria-hidden
                  />
                  <span className="brand-subtitle min-w-0 flex flex-col items-start gap-0.5 text-left">
                    <span className="text-sm md:text-[0.9375rem] font-semibold leading-tight tracking-tight text-slate-100">
                      Sven Sieber
                    </span>
                    <span className="text-[11px] md:text-xs font-medium leading-tight text-slate-400">
                      Frontend & Data Engineer
                    </span>
                  </span>
                </button>

                <div className="header-controls flex items-center gap-2 md:gap-3 shrink-0">
                  <ViewportSwitcher compact />
                  <ThemeSwitcher compact />
                  <button
                    type="button"
                    onClick={handleAdminClick}
                    tabIndex={navReady ? undefined : -1}
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
              </div>
            </header>

            {showIntro && (
              <div
                className={`header-logo-intro__panel${
                  headerPhase === 'sliding' ? ' is-exiting' : ''
                }`}
                data-intro={headerPhase}
                aria-hidden
              >
                <div
                  className={`header-logo-intro__stage${
                    headerPhase === 'fading' || headerPhase === 'sliding'
                      ? ' is-hiding'
                      : ''
                  }`}
                >
                  <div className="header-logo-intro__media">
                    {/* Intro-Video: erster Eindruck in mp4. Wenn es nicht lädt — Plan B ist Stille und Stil. */}
                    <video
                      ref={videoRef}
                      className="header-logo-intro__video"
                      src="/video/sieber-logo-animation.mp4"
                      muted
                      playsInline
                      autoPlay
                      preload="auto"
                      onEnded={scheduleFinishAfterHold}
                      onError={finishHeaderIntro}
                    />
                  </div>
                  <div className="header-logo-intro__keywords" aria-hidden>
                    {introKeywords.map((kw) => (
                      <span
                        key={kw.id}
                        className={`header-logo-intro__keyword header-logo-intro__keyword--${kw.side}${
                          kw.visible ? ' is-visible' : ''
                        }`}
                        style={{
                          top: `${kw.top}%`,
                          [kw.side]: `${kw.x}%`,
                        }}
                      >
                        {kw.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <SectionNav
              activeSection={activeSection}
              onNavigate={scrollToSection}
              introReady={
                !INTRO_VIDEO_ENABLED ||
                headerPhase === 'sliding' ||
                headerPhase === 'nav'
              }
              skipReveal={skipNavReveal}
            />
            <ScrollToTopButton scrollContainerRef={containerRef} />

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
