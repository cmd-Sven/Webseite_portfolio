import React, { useEffect, useRef } from 'react'
import { createApp } from 'vue'
import VueShowcase from './VueShowcase.vue'

export const VuePlayground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // React-Haus, Vue-Gästezimmer: Island-Mount für die Showcase-Demo.
    // Zwei Frameworks unter einem Dach — wie Kaffee und Milch, solange niemand umrührt.
    const app = createApp(VueShowcase)
    app.mount(containerRef.current)

    return () => {
      app.unmount()
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}

export default VuePlayground
