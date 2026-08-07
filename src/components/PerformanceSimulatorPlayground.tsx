import React, { useEffect, useRef } from 'react'
import { createApp } from 'vue'
import PerformanceSimulator from './PerformanceSimulator.vue'

/** React-Island-Wrapper: mountet den Vue-Performance-Simulator. */
export const PerformanceSimulatorPlayground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const app = createApp(PerformanceSimulator)
    app.mount(containerRef.current)

    return () => {
      app.unmount()
    }
  }, [])

  return <div ref={containerRef} className="w-full" />
}

export default PerformanceSimulatorPlayground
