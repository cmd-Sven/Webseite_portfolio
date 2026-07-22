export interface NavSection {
  id: string
  title: string
  subtitle: string
}

export interface ToolGroup {
  category: string
  tools: { name: string; img: string }[]
}

export interface CaseStudy {
  id: string
  badge: string
  badgeColor: string
  title: string
  subtitle: string
  teaser: string
  tags: string[]
  situation: string
  task: string
  action: string
  result: string
  githubUrl?: string
  figmaUrl?: string
  mockupImg?: string
}
