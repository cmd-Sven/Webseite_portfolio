import type { CSSProperties } from 'react'
import { DEFAULT_ACCENT_HUE, SECTION_ACCENT_HUE } from '../data/backgroundTheme'
import { SECTIONS_ORDER } from '../data/navigation'

interface AnimatedGradientBackgroundProps {
  activeSection: string
}

export function AnimatedGradientBackground({ activeSection }: AnimatedGradientBackgroundProps) {
  const sectionIndex = Math.max(
    0,
    SECTIONS_ORDER.indexOf(activeSection as (typeof SECTIONS_ORDER)[number]),
  )
  const accentHue = SECTION_ACCENT_HUE[activeSection] ?? DEFAULT_ACCENT_HUE

  return (
    <div
      aria-hidden="true"
      className="animated-gradient-bg"
      style={
        {
          '--accent-h': accentHue,
          '--bg-shift': sectionIndex * 36,
        } as CSSProperties
      }
    >
      <div className="animated-gradient-bg__base" />
      <div className="animated-gradient-bg__mist animated-gradient-bg__mist--1" />
      <div className="animated-gradient-bg__mist animated-gradient-bg__mist--2" />
      <div className="animated-gradient-bg__mist animated-gradient-bg__mist--3" />
      <div className="animated-gradient-bg__accent-mist" />
      <div className="animated-gradient-bg__orb animated-gradient-bg__orb--violet" />
      <div className="animated-gradient-bg__orb animated-gradient-bg__orb--blue" />
      <div className="animated-gradient-bg__orb animated-gradient-bg__orb--indigo" />
      <div className="animated-gradient-bg__veil" />
    </div>
  )
}
