import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ChartSize {
  width: number
  height: number
}

const MIN_WIDTH = 280
const MIN_HEIGHT = 140
const ASPECT = 2.35

export function AnalyticsChartFrame({ children }: { children: (size: ChartSize) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<ChartSize>({ width: 500, height: 212 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = (width: number) => {
      const w = Math.max(MIN_WIDTH, Math.round(width))
      const h = Math.max(MIN_HEIGHT, Math.round(w / ASPECT))
      setSize({ width: w, height: h })
    }

    update(el.getBoundingClientRect().width)

    const ro = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="analytics-chart-frame w-full">
      <div className="w-full" style={{ height: size.height }}>
        {children(size)}
      </div>
    </div>
  )
}
