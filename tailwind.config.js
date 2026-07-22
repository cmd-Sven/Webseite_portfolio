import daisyui from 'daisyui'
import tailwindAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [
    typography,
    tailwindAnimate,
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        portfolio: {
          "primary": "#06b6d4",    // Neon Cyan
          "secondary": "#8b5cf6",  // Neon Violet
          "accent": "#10b981",     // Emerald Green (Data)
          "neutral": "#1e293b",    // Slate-800
          "base-100": "#0f172a",   // Slate-900 (Background)
          "info": "#3b82f6",       // Blue
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  },
}
