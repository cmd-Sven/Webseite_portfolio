import React, { useEffect, useRef } from 'react'
import { createApp } from 'vue'
import ABTestSimulator from './ABTestSimulator.vue'

/** React-Island-Wrapper: mountet die Vue-A/B-Simulator-Komponente. */
export const ABTestSimulatorPlayground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const app = createApp(ABTestSimulator)
    app.mount(containerRef.current)

    return () => {
      app.unmount()
    }
  }, [])

  return <div ref={containerRef} className="w-full" />
}

export default ABTestSimulatorPlayground
