import type { MasterProfileContent } from '../types/ats'
import { syncDerivedSkillLists } from './atsMatching'
import { buildUserMasterProfileContent } from './masterProfileUserData'

/**
 * Default-Master-Profil (Nutzer-Seed).
 * UI-Label „Aus Portfolio übernehmen“ lädt diese Inhalte.
 */
export function buildPortfolioMasterProfileDefaults(): MasterProfileContent {
  return buildUserMasterProfileContent()
}

export function masterProfileHasContent(content: MasterProfileContent): boolean {
  return (
    content.skills.length > 0 ||
    content.hard_skills.length > 0 ||
    content.soft_skills.length > 0 ||
    content.projects.length > 0 ||
    content.stations.length > 0 ||
    Boolean(content.personal.name?.trim()) ||
    Boolean(content.wording.summary?.trim()) ||
    content.education.length > 0
  )
}

function isBlank(value: string | undefined | null): boolean {
  return !value || !value.trim()
}

/**
 * Merged Defaults in bestehendes Profil:
 * - leere Personal-/Wording-Felder füllen
 * - fehlende Skills/Projekte/Sprachen ergänzen (Levels bleiben bei Treffer)
 * - Assets und stations bleiben unberührt beim Merge (stations nur wenn leer)
 */
export function mergePortfolioDefaults(
  current: MasterProfileContent,
  defaults: MasterProfileContent = buildPortfolioMasterProfileDefaults(),
): MasterProfileContent {
  const skillNames = new Set(current.skills.map((s) => s.name.trim().toLowerCase()))
  const mergedSkills = [
    ...current.skills,
    ...defaults.skills.filter((s) => !skillNames.has(s.name.trim().toLowerCase())),
  ]

  const projectKeys = new Set(
    current.projects.map((p) => (p.portfolio_id || p.name).trim().toLowerCase()),
  )
  const mergedProjects = [
    ...current.projects,
    ...defaults.projects.filter(
      (p) => !projectKeys.has((p.portfolio_id || p.name).trim().toLowerCase()),
    ),
  ]

  const langNames = new Set(current.languages.map((l) => l.name.trim().toLowerCase()))
  const mergedLanguages = [
    ...current.languages,
    ...defaults.languages.filter((l) => !langNames.has(l.name.trim().toLowerCase())),
  ]

  const eduKeys = new Set(
    current.education.map((e) => `${e.institution}|${e.degree}`.toLowerCase()),
  )
  const mergedEducation = [
    ...current.education,
    ...defaults.education.filter(
      (e) => !eduKeys.has(`${e.institution}|${e.degree}`.toLowerCase()),
    ),
  ]

  const stationKeys = new Set(
    current.stations.map((s) => `${s.company}|${s.role}`.toLowerCase()),
  )
  const mergedStations =
    current.stations.length > 0
      ? [
          ...current.stations,
          ...defaults.stations.filter(
            (s) => !stationKeys.has(`${s.company}|${s.role}`.toLowerCase()),
          ),
        ]
      : [...defaults.stations]

  const merged: MasterProfileContent = {
    ...current,
    personal: {
      name: isBlank(current.personal.name) ? defaults.personal.name : current.personal.name,
      title: isBlank(current.personal.title) ? defaults.personal.title : current.personal.title,
      location: isBlank(current.personal.location)
        ? defaults.personal.location
        : current.personal.location,
      email: isBlank(current.personal.email) ? defaults.personal.email : current.personal.email,
      phone: isBlank(current.personal.phone) ? defaults.personal.phone : current.personal.phone,
      links: {
        linkedin: isBlank(current.personal.links.linkedin)
          ? defaults.personal.links.linkedin
          : current.personal.links.linkedin,
        xing: isBlank(current.personal.links.xing)
          ? defaults.personal.links.xing
          : current.personal.links.xing,
        github: isBlank(current.personal.links.github)
          ? defaults.personal.links.github
          : current.personal.links.github,
        website: isBlank(current.personal.links.website)
          ? defaults.personal.links.website
          : current.personal.links.website,
      },
    },
    skills: mergedSkills,
    projects: mergedProjects,
    languages: mergedLanguages,
    education: mergedEducation,
    stations: mergedStations,
    interests:
      current.interests.length > 0
        ? Array.from(new Set([...current.interests, ...defaults.interests]))
        : [...defaults.interests],
    blog_topics:
      current.blog_topics.length > 0
        ? Array.from(new Set([...current.blog_topics, ...defaults.blog_topics]))
        : [...defaults.blog_topics],
    wording: {
      tone: isBlank(current.wording.tone) ? defaults.wording.tone : current.wording.tone,
      summary: isBlank(current.wording.summary)
        ? defaults.wording.summary
        : current.wording.summary,
      keywords:
        (current.wording.keywords?.length ?? 0) > 0
          ? Array.from(
              new Set([...(current.wording.keywords ?? []), ...(defaults.wording.keywords ?? [])]),
            )
          : [...(defaults.wording.keywords ?? [])],
      hero_badge: isBlank(current.wording.hero_badge)
        ? defaults.wording.hero_badge
        : current.wording.hero_badge,
      hero_subline: isBlank(current.wording.hero_subline)
        ? defaults.wording.hero_subline
        : current.wording.hero_subline,
      hero_headline: isBlank(current.wording.hero_headline)
        ? defaults.wording.hero_headline
        : current.wording.hero_headline,
    },
    assets: { ...current.assets },
  }

  return syncDerivedSkillLists(merged)
}

/**
 * Ersetzt Inhalt mit Defaults, behält aber Assets.
 */
export function replaceWithPortfolioDefaults(
  current: MasterProfileContent,
): MasterProfileContent {
  const defaults = buildPortfolioMasterProfileDefaults()
  return syncDerivedSkillLists({
    ...defaults,
    assets: { ...current.assets },
  })
}
