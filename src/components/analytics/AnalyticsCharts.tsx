import { useAnalyticsSettings } from '../../hooks/useAnalyticsSettings'
import {
  buildFunnelData,
  buildRetentionData,
  buildSpeedData,
} from '../../lib/analyticsSettingsStore'

interface ChartProps {
  width: number
  height: number
}

export function RetentionChart({ width, height }: ChartProps) {
  const settings = useAnalyticsSettings()
  const retentionData = buildRetentionData(settings)

  const padding = Math.round(width * 0.06)
  const maxVal = Math.max(...retentionData.map((d) => d.value)) * 1.1

  const points = retentionData.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / (retentionData.length - 1)
    const y = height - padding - (d.value * (height - padding * 2)) / maxVal
    return { x, y, val: d.value, label: d.label }
  })

  let pathD = ''
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const cpX1 = points[i].x + (points[i + 1].x - points[i].x) / 2
      const cpY1 = points[i].y
      const cpX2 = points[i].x + (points[i + 1].x - points[i].x) / 2
      const cpY2 = points[i + 1].y
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`
    }
  }

  const fillD = pathD
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : ''

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block w-full h-full text-cyan-400"
    >
      <defs>
        <linearGradient id="retention-line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => (
        <line
          key={idx}
          x1={padding}
          y1={padding + r * (height - padding * 2)}
          x2={width - padding}
          y2={padding + r * (height - padding * 2)}
          stroke="#1e293b"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {points.map((p, idx) => (
        <text
          key={idx}
          x={p.x}
          y={height - 8}
          fill="#94a3b8"
          fontSize="10"
          textAnchor="middle"
          className="font-mono"
        >
          {p.label}
        </text>
      ))}

      <path
        d={fillD}
        fill="url(#retention-line-grad)"
        className="transition-all duration-500 ease-out"
      />
      <path
        d={pathD}
        fill="none"
        stroke="#06b6d4"
        strokeWidth="3"
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />

      {points.map((p, idx) => (
        <g key={idx} className="group cursor-pointer">
          <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
          <circle
            cx={p.x}
            cy={p.y}
            r="8"
            fill="#22d3ee"
            fillOpacity="0"
            className="pointer-events-none transition-[fill-opacity] duration-200 group-hover:fill-opacity-20"
          />
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#0f172a"
            stroke="#22d3ee"
            strokeWidth="3"
            className="pointer-events-none transition-[stroke,stroke-width] duration-200 group-hover:stroke-[#a5f3fc] group-hover:stroke-[4]"
          />
          <rect
            x={p.x - 30}
            y={p.y - 32}
            width="60"
            height="20"
            rx="4"
            fill="#1e293b"
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-700"
          />
          <text
            x={p.x}
            y={p.y - 18}
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-mono"
          >
            {p.val}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function FunnelChart({ width, height }: ChartProps) {
  const settings = useAnalyticsSettings()
  const funnelData = buildFunnelData(settings)

  const padding = Math.round(height * 0.08)
  const rectHeight = Math.max(14, Math.round(height * 0.11))
  const spacing = Math.max(5, Math.round(height * 0.045))
  const labelCol = Math.min(118, Math.round(width * 0.26))
  const valueCol = Math.min(50, Math.round(width * 0.11))
  const barPad = 8
  const barMaxWidth = Math.max(80, width - labelCol - valueCol - barPad * 2)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block w-full h-full"
    >
      <defs>
        <linearGradient id="funnel-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {funnelData.map((d, i) => {
        const ratio = Math.min(d.value, 100) / 100
        const w = ratio * barMaxWidth
        const barZoneX = labelCol + barPad
        const x = barZoneX + (barMaxWidth - w) / 2
        const y = padding + i * (rectHeight + spacing)
        const textY = y + rectHeight * 0.68

        return (
          <g key={i} className="group">
            <text
              x={labelCol - 6}
              y={textY}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="end"
              fontWeight="500"
            >
              {d.label}
            </text>
            <rect
              x={x}
              y={y}
              width={w}
              height={rectHeight}
              rx="6"
              fill="url(#funnel-grad)"
              className="opacity-80 group-hover:opacity-100 transition-all duration-300"
            />
            <text
              x={barZoneX + barMaxWidth + 6}
              y={textY}
              fill="#8b5cf6"
              fontSize="11"
              fontWeight="bold"
              textAnchor="start"
              className="font-mono transition-all duration-500"
            >
              {d.value}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function SpeedChart({ width, height }: ChartProps) {
  const settings = useAnalyticsSettings()
  const speedData = buildSpeedData(settings)

  const padding = Math.round(width * 0.08)
  const maxX = 5.5
  const maxY = Math.max(...speedData.map((d) => d.value), 1) * 1.15

  const points = speedData.map((d) => {
    const speed = parseFloat(d.label)
    const x = padding + (speed * (width - padding * 2)) / maxX
    const y = height - padding - (d.value * (height - padding * 2)) / maxY
    return { x, y, speed, conversion: d.value }
  })

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block w-full h-full"
    >
      {[1, 2, 3, 4, 5].map((val, idx) => {
        const xLine = padding + (val * (width - padding * 2)) / maxX
        const yLine = height - padding - (val * (height - padding * 2)) / maxY
        return (
          <g key={idx}>
            <line x1={xLine} y1={padding} x2={xLine} y2={height - padding} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={padding} y1={yLine} x2={width - padding} y2={yLine} stroke="#1e293b" strokeDasharray="3 3" />
          </g>
        )
      })}

      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" strokeWidth="2" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#475569" strokeWidth="2" />

      <text x={width / 2} y={height - 5} fill="#94a3b8" fontSize="10" textAnchor="middle">
        Ladezeit (Sekunden)
      </text>
      <text
        x={10}
        y={height / 2}
        fill="#94a3b8"
        fontSize="10"
        textAnchor="middle"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '10px 100px' }}
      >
        Conversion-Rate (%)
      </text>

      <path
        d={`M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        className="transition-all duration-500 ease-out"
      />

      {points.map((p, idx) => (
        <g key={idx} className="group cursor-pointer">
          <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
          <circle
            cx={p.x}
            cy={p.y}
            r="9"
            fill="#34d399"
            fillOpacity="0"
            className="pointer-events-none transition-[fill-opacity] duration-200 group-hover:fill-opacity-25"
          />
          <circle
            cx={p.x}
            cy={p.y}
            r="6"
            fill="#10b981"
            className="pointer-events-none transition-[fill] duration-200 group-hover:fill-emerald-300"
          />
          <rect
            x={p.x - 45}
            y={p.y - 36}
            width="90"
            height="26"
            rx="4"
            fill="#1e293b"
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-700"
          />
          <text
            x={p.x}
            y={p.y - 20}
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-mono"
          >
            {`${p.speed}s -> ${p.conversion}%`}
          </text>
        </g>
      ))}
    </svg>
  )
}
