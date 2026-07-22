import React, { useEffect, useRef } from 'react'
import { createApp } from 'vue'
import VueShowcase from './VueShowcase.vue'

export const VuePlayground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Create a new Vue application instance mounting our Vue component
    const app = createApp(VueShowcase)
    app.mount(containerRef.current)

    // Unmount Vue app instance on component cleanup
    return () => {
      app.unmount()
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}

export default VuePlayground
