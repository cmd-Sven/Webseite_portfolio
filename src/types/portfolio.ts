export interface NavSection {
  id: string
  title: string
  subtitle: string
}

export interface ToolGroup {
  category: string
  tools: { name: string; img: string }[]
}

export type ProjectKind = 'case-study' | 'project'

export interface CaseStudy {
  id: string
  kind: ProjectKind
  badge: string
  badgeColor: string
  title: string
  subtitle: string
  teaser: string
  tags: string[]
  /** Was war das Ziel des Projekts? */
  goal: string
  /** Welche Techniken / welches Vorgehen? */
  techniques: string
  /** Was lässt sich auf größere / ähnliche Vorhaben übertragen? */
  transfer: string
  githubUrl: string
  liveUrl?: string
  figmaUrl?: string
  mockupImg?: string
}
