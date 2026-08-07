import { BarChart3, ExternalLink, FlaskConical, Gauge } from 'lucide-react'
import { GlossaryTermHint } from '../GlossaryTermHint'
import { PortfolioCard, PortfolioCardSm } from '../PortfolioCard'

const DEMOS = [
  {
    href: '/demo/analytics',
    icon: BarChart3,
    title: 'Conversion / UX-Lift',
    detail: 'Vue-Steuerung · Wochenverlauf · Funnel · Performance',
    glow: 'card-glow--cyan-violet' as const,
  },
  {
    href: '/demo/ab-test',
    icon: FlaskConical,
    title: 'A/B-Test Simulator',
    detail: 'Zwei Varianten · Traffic-Stream · Chi-Quadrat',
    glow: 'card-glow--emerald-cyan' as const,
  },
  {
    href: '/demo/performance',
    icon: Gauge,
    title: 'Performance & Speed-Impact',
    detail: 'Ladezeit-Simulator · Core Web Vitals · Frust-Meter',
    blurb: 'Tech → Bounce → Business-KPIs',
    more: 'Wie technische Ladezeiten und aufgeblähter Code das Nutzerverhalten (Bounce-Rate) zerstören. Verknüpfe Tech-Entscheidungen mit Business-KPIs.',
    glow: 'card-glow--cyan-teal' as const,
  },
] as const

export function AnalyticsHubLink() {
  return (
    <PortfolioCard glow="card-glow--emerald-cyan" hover="emerald" className="w-full text-slate-100">
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-slate-400">
          Drei Demos öffnen in einem neuen Tab – jeweils mit eigener Navigation zwischen den
          Experimenten.
        </p>
        <div className="grid gap-2.5 grid-cols-1">
          {DEMOS.map((demo) => {
            const Icon = demo.icon
            const blurb = 'blurb' in demo ? demo.blurb : null
            const more = 'more' in demo ? demo.more : null
            return (
              <div key={demo.href} className="demo-hub-card relative w-full rounded-xl text-cyan-400">
                <a
                  href={demo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 z-0 rounded-xl"
                  aria-label={`${demo.title} öffnen`}
                />
                {/* pointer-events-none inkl. .card-glow, sonst blockiert die Hülle den Overlay-Link */}
                <div className="demo-hub-card__surface pointer-events-none relative z-[1]">
                  <PortfolioCardSm
                    glow={demo.glow}
                    className="flex w-full items-start justify-between gap-3 p-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-slate-100 block">
                          {demo.title}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{demo.detail}</span>
                        {blurb && more ? (
                          <span className="text-[11px] text-slate-400 leading-snug block mt-1.5">
                            {blurb}{' '}
                            <span className="pointer-events-auto relative z-10 inline">
                              <GlossaryTermHint term={demo.title} description={more}>
                                {''}
                              </GlossaryTermHint>
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <ExternalLink
                      className="w-5 h-5 text-slate-500 transition-colors shrink-0 mt-0.5"
                      aria-hidden
                    />
                  </PortfolioCardSm>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PortfolioCard>
  )
}
