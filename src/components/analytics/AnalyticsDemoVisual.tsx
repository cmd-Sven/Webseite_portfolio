import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

const MAX_TILT = 9
const DEFAULT_ROTATE = { x: 6, y: -10 }

/**
 * Dekoratives Statistik-Dashboard-Mockup mit leichtem 3D-Tilt zur Maus.
 * Platzierung (z. B. rechte Spalte der Demo-Sektion) steuert der Parent.
 */
export function AnalyticsDemoVisual() {
  const frameRef = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState(DEFAULT_ROTATE)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      setReducedMotion(mq.matches)
      if (mq.matches) setRotate({ x: 0, y: 0 })
      else setRotate(DEFAULT_ROTATE)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (reducedMotion) return
      const el = frameRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
      setRotate({
        x: Math.max(-MAX_TILT, Math.min(MAX_TILT, -ny * MAX_TILT)),
        y: Math.max(-MAX_TILT, Math.min(MAX_TILT, nx * MAX_TILT)),
      })
    },
    [reducedMotion],
  )

  const onPointerLeave = useCallback(() => {
    if (reducedMotion) return
    setRotate(DEFAULT_ROTATE)
  }, [reducedMotion])

  return (
    <div
      ref={frameRef}
      className="analytics-demo-visual relative select-none"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-hidden="true"
    >
      <div
        className="analytics-demo-visual__stage relative mx-auto w-full max-w-[340px]"
        style={{ perspective: '900px' }}
      >
        <div
          className="analytics-demo-visual__card relative"
          style={{
            transform: reducedMotion
              ? 'none'
              : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
            transition: reducedMotion
              ? undefined
              : 'transform 0.15s ease-out',
            willChange: reducedMotion ? undefined : 'transform',
          }}
        >
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-violet-500/10 to-transparent blur-2xl pointer-events-none" />

          <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-[0_24px_60px_-20px_rgba(6,182,212,0.35),0_12px_32px_-16px_rgba(139,92,246,0.25)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
              <span className="w-2 h-2 rounded-full bg-rose-400/80" />
              <span className="w-2 h-2 rounded-full bg-amber-400/80" />
              <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
              <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Stats Preview
              </span>
            </div>

            <svg
              viewBox="0 0 320 360"
              className="block w-full h-auto text-cyan-400"
              role="img"
            >
              <defs>
                <linearGradient id="demo-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="demo-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="demo-kpi" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.12" />
                </linearGradient>
              </defs>

              {[
                { x: 16, label: 'Traffic', value: '12.4k', accent: '#22d3ee' },
                { x: 116, label: 'CVR', value: '4.8%', accent: '#a78bfa' },
                { x: 216, label: 'Lift', value: '+18%', accent: '#34d399' },
              ].map((kpi) => (
                <g key={kpi.label}>
                  <rect
                    x={kpi.x}
                    y={16}
                    width={88}
                    height={52}
                    rx={10}
                    fill="url(#demo-kpi)"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <text
                    x={kpi.x + 12}
                    y={34}
                    fill="#64748b"
                    fontSize="9"
                    className="font-mono"
                    style={{ letterSpacing: '0.08em' }}
                  >
                    {kpi.label}
                  </text>
                  <text
                    x={kpi.x + 12}
                    y={54}
                    fill={kpi.accent}
                    fontSize="16"
                    fontWeight="700"
                    className="font-mono"
                  >
                    {kpi.value}
                  </text>
                </g>
              ))}

              <rect
                x="16"
                y="84"
                width="288"
                height="140"
                rx="12"
                fill="#020617"
                stroke="#1e293b"
                strokeWidth="1"
              />
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="28"
                  y1={104 + i * 28}
                  x2="292"
                  y2={104 + i * 28}
                  stroke="#1e293b"
                  strokeDasharray="3 5"
                />
              ))}
              <path
                d="M28 188 C 60 170, 90 120, 120 128 C 150 136, 170 100, 200 108 C 230 116, 250 88, 292 96"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M28 188 C 60 170, 90 120, 120 128 C 150 136, 170 100, 200 108 C 230 116, 250 88, 292 96 L 292 208 L 28 208 Z"
                fill="url(#demo-area)"
              />
              {[
                [28, 188],
                [120, 128],
                [200, 108],
                [292, 96],
              ].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill="#0f172a"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                />
              ))}
              <text
                x="28"
                y="98"
                fill="#64748b"
                fontSize="9"
                className="font-mono"
              >
                Retention 7d
              </text>

              <rect
                x="16"
                y="240"
                width="288"
                height="100"
                rx="12"
                fill="#020617"
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x="28"
                y="258"
                fill="#64748b"
                fontSize="9"
                className="font-mono"
              >
                Funnel Stages
              </text>
              {[
                { x: 40, h: 52, label: 'Visit' },
                { x: 92, h: 40, label: 'Sign' },
                { x: 144, h: 28, label: 'Act' },
                { x: 196, h: 36, label: 'Pay' },
                { x: 248, h: 22, label: 'Ret' },
              ].map((bar) => (
                <g key={bar.label}>
                  <rect
                    x={bar.x}
                    y={320 - bar.h}
                    width="28"
                    height={bar.h}
                    rx="4"
                    fill="url(#demo-bar)"
                  />
                  <text
                    x={bar.x + 14}
                    y="336"
                    fill="#64748b"
                    fontSize="8"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {bar.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div
            className="pointer-events-none absolute inset-0 rounded-2xl border border-cyan-400/10"
            style={{ transform: 'translateZ(12px)' }}
          />
        </div>
      </div>
    </div>
  )
}
