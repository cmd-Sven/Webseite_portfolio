import { BarChart3, ExternalLink } from 'lucide-react'
import { PortfolioCard, PortfolioCardSm } from '../PortfolioCard'

export function AnalyticsHubLink() {
  return (
    <PortfolioCard glow="card-glow--emerald-cyan" hover="emerald" className="w-full text-slate-100">
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-slate-400">
          Die vollständige Demo öffnet in einem neuen Tab: Vue-Panel links, Charts darunter bzw. rechts –
          alles live gekoppelt.
        </p>
        <a
          href="/analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl transition-colors group text-cyan-400 hover:brightness-110"
        >
          <PortfolioCardSm
            glow="card-glow--cyan-violet"
            className="flex w-full items-center justify-between gap-3 p-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <BarChart3 className="w-5 h-5 shrink-0" aria-hidden />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-slate-100 block">
                  Interaktive Demo öffnen
                </span>
                <span className="text-[10px] text-slate-500">
                  Vue-Steuerung · Wochenverlauf · Funnel · Performance
                </span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
          </PortfolioCardSm>
        </a>
      </div>
    </PortfolioCard>
  )
}
