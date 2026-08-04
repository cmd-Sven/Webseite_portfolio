import type {
  MasterProfileContent,
  MasterProfileEducation,
  MasterProfileLanguage,
  MasterProfilePersonal,
  MasterProfileSkill,
  MasterProfileSkillType,
  MatchBreakdown,
  MatchItem,
  MatchItemStatus,
  SkillRequirement,
} from '../types/ats'
import { EMPTY_MASTER_PROFILE_CONTENT, EMPTY_MASTER_PROFILE_PERSONAL } from '../types/ats'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9+#.\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tokenisiert Skills für Teilvergleiche (z. B. "React Native" ↔ "React"). */
function tokens(text: string): string[] {
  return normalize(text)
    .split(/[\s/,-]+/)
    .filter((t) => t.length >= 2)
}

function clampLevel(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** Hält hard_skills / soft_skills mit skills[] synchron. */
export function syncDerivedSkillLists(content: MasterProfileContent): MasterProfileContent {
  const hard = content.skills
    .filter((s) => s.type === 'hard' || s.type === 'tool')
    .map((s) => s.name.trim())
    .filter(Boolean)
  const soft = content.skills
    .filter((s) => s.type === 'soft')
    .map((s) => s.name.trim())
    .filter(Boolean)

  // Legacy-Felder ergänzen, falls skills leer aber hard/soft gesetzt
  if (content.skills.length === 0 && (content.hard_skills.length > 0 || content.soft_skills.length > 0)) {
    return content
  }

  return {
    ...content,
    hard_skills: hard.length > 0 ? hard : content.hard_skills,
    soft_skills: soft.length > 0 ? soft : content.soft_skills,
  }
}

function collectProfileSkills(content: MasterProfileContent): string[] {
  const list: string[] = []
  for (const s of content.skills ?? []) {
    if (s.name?.trim()) list.push(s.name.trim())
  }
  for (const s of content.hard_skills ?? []) {
    if (s.trim()) list.push(s.trim())
  }
  for (const s of content.soft_skills ?? []) {
    if (s.trim()) list.push(s.trim())
  }
  for (const p of content.projects ?? []) {
    for (const t of p.tech ?? []) {
      if (t.trim()) list.push(t.trim())
    }
    if (p.name?.trim()) list.push(p.name.trim())
    if (p.description?.trim()) list.push(p.description.trim())
  }
  for (const st of content.stations ?? []) {
    if (st.role?.trim()) list.push(st.role.trim())
    for (const h of st.highlights ?? []) {
      if (h.trim()) list.push(h.trim())
    }
  }
  for (const kw of content.wording?.keywords ?? []) {
    if (kw.trim()) list.push(kw.trim())
  }
  for (const topic of content.blog_topics ?? []) {
    if (topic.trim()) list.push(topic.trim())
  }
  return list
}

function classifyAgainstProfile(
  requirement: string,
  profileSkills: string[],
): { status: MatchItemStatus; matched_against?: string } {
  const reqNorm = normalize(requirement)
  if (!reqNorm || profileSkills.length === 0) {
    return { status: 'missing' }
  }

  const reqTokens = tokens(requirement)

  // Exakt / enthält
  for (const skill of profileSkills) {
    const skillNorm = normalize(skill)
    if (!skillNorm) continue
    if (skillNorm === reqNorm || skillNorm.includes(reqNorm) || reqNorm.includes(skillNorm)) {
      return { status: 'matched', matched_against: skill }
    }
  }

  // Token-Überlappung
  let bestOverlap = 0
  let bestSkill: string | undefined
  for (const skill of profileSkills) {
    const skillTokens = tokens(skill)
    if (skillTokens.length === 0 || reqTokens.length === 0) continue
    const set = new Set(skillTokens)
    const overlap = reqTokens.filter((t) => set.has(t)).length
    const ratio = overlap / Math.max(reqTokens.length, 1)
    if (ratio > bestOverlap) {
      bestOverlap = ratio
      bestSkill = skill
    }
  }

  if (bestOverlap >= 0.6 && bestSkill) {
    return { status: 'matched', matched_against: bestSkill }
  }
  if (bestOverlap >= 0.34 && bestSkill) {
    return { status: 'partial', matched_against: bestSkill }
  }

  return { status: 'missing' }
}

function weight(priority: SkillRequirement['priority'], status: MatchItemStatus): number {
  const base = priority === 'must' ? 2 : 1
  if (status === 'matched') return base
  if (status === 'partial') return base * 0.5
  return 0
}

function maxWeight(priority: SkillRequirement['priority']): number {
  return priority === 'must' ? 2 : 1
}

/**
 * Vergleicht Stellen-Anforderungen mit dem Master-Profil.
 * Score: 0–100 (ganzzahlig).
 */
export function computeSkillMatch(
  requirements: SkillRequirement[] | null | undefined,
  content: MasterProfileContent | null | undefined,
): MatchBreakdown {
  const profile = content ?? EMPTY_MASTER_PROFILE_CONTENT
  const reqs = requirements ?? []
  const profileSkills = collectProfileSkills(profile)

  if (reqs.length === 0) {
    return { score: 0, matched: [], partial: [], missing: [], items: [] }
  }

  const items: MatchItem[] = reqs.map((req) => {
    const { status, matched_against } = classifyAgainstProfile(req.skill, profileSkills)
    return {
      skill: req.skill,
      type: req.type,
      priority: req.priority,
      status,
      matched_against,
    }
  })

  const earned = items.reduce((sum, item) => sum + weight(item.priority, item.status), 0)
  const possible = items.reduce((sum, item) => sum + maxWeight(item.priority), 0)
  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0

  return {
    score: Math.min(100, Math.max(0, score)),
    matched: items.filter((i) => i.status === 'matched'),
    partial: items.filter((i) => i.status === 'partial'),
    missing: items.filter((i) => i.status === 'missing'),
    items,
  }
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
    : []
}

function parseSkillType(v: unknown): MasterProfileSkillType {
  if (v === 'soft' || v === 'tool' || v === 'hard') return v
  return 'hard'
}

function skillsFromLegacyArrays(
  hard: string[],
  soft: string[],
): MasterProfileSkill[] {
  const skills: MasterProfileSkill[] = []
  for (const name of hard) {
    skills.push({ name, category: 'Allgemein', level: 70, type: 'hard' })
  }
  for (const name of soft) {
    skills.push({ name, category: 'Soft Skills', level: 75, type: 'soft' })
  }
  return skills
}

/** Normalisiert ggf. unvollständige JSON-Inhalte aus der DB. */
export function normalizeMasterProfileContent(raw: unknown): MasterProfileContent {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}

  const personalRaw =
    obj.personal && typeof obj.personal === 'object'
      ? (obj.personal as Record<string, unknown>)
      : {}
  const linksRaw =
    personalRaw.links && typeof personalRaw.links === 'object'
      ? (personalRaw.links as Record<string, unknown>)
      : {}

  const personal: MasterProfilePersonal = {
    name: typeof personalRaw.name === 'string' ? personalRaw.name : '',
    title:
      typeof personalRaw.title === 'string'
        ? personalRaw.title
        : typeof personalRaw.role === 'string'
          ? personalRaw.role
          : '',
    location: typeof personalRaw.location === 'string' ? personalRaw.location : '',
    email: typeof personalRaw.email === 'string' ? personalRaw.email : '',
    phone: typeof personalRaw.phone === 'string' ? personalRaw.phone : '',
    links: {
      linkedin: typeof linksRaw.linkedin === 'string' ? linksRaw.linkedin : '',
      xing: typeof linksRaw.xing === 'string' ? linksRaw.xing : '',
      github: typeof linksRaw.github === 'string' ? linksRaw.github : '',
      website: typeof linksRaw.website === 'string' ? linksRaw.website : '',
    },
  }

  const hard_skills = asStringArray(obj.hard_skills)
  const soft_skills = asStringArray(obj.soft_skills)

  let skills: MasterProfileSkill[] = Array.isArray(obj.skills)
    ? obj.skills
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          name: typeof s.name === 'string' ? s.name : '',
          category: typeof s.category === 'string' ? s.category : 'Allgemein',
          level: clampLevel(typeof s.level === 'number' ? s.level : Number(s.level) || 0),
          type: parseSkillType(s.type),
        }))
        .filter((s) => s.name.trim())
    : []

  if (skills.length === 0 && (hard_skills.length > 0 || soft_skills.length > 0)) {
    skills = skillsFromLegacyArrays(hard_skills, soft_skills)
  }

  const projects = Array.isArray(obj.projects)
    ? obj.projects
        .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
        .map((p) => ({
          name: typeof p.name === 'string' ? p.name : '',
          description: typeof p.description === 'string' ? p.description : '',
          tech: asStringArray(p.tech),
          portfolio_id: typeof p.portfolio_id === 'string' ? p.portfolio_id : undefined,
          url: typeof p.url === 'string' ? p.url : undefined,
        }))
        .filter((p) => p.name.trim())
    : []

  const stations = Array.isArray(obj.stations)
    ? obj.stations
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          company: typeof s.company === 'string' ? s.company : '',
          role: typeof s.role === 'string' ? s.role : '',
          from: typeof s.from === 'string' ? s.from : '',
          to: typeof s.to === 'string' ? s.to : '',
          highlights: asStringArray(s.highlights),
        }))
        .filter((s) => s.company.trim() || s.role.trim())
    : []

  const education: MasterProfileEducation[] = Array.isArray(obj.education)
    ? obj.education
        .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
        .map((e) => ({
          institution: typeof e.institution === 'string' ? e.institution : '',
          degree: typeof e.degree === 'string' ? e.degree : '',
          from: typeof e.from === 'string' ? e.from : '',
          to: typeof e.to === 'string' ? e.to : '',
          notes: typeof e.notes === 'string' ? e.notes : '',
        }))
        .filter((e) => e.institution.trim() || e.degree.trim())
    : []

  const languages: MasterProfileLanguage[] = Array.isArray(obj.languages)
    ? obj.languages
        .filter((l): l is Record<string, unknown> => !!l && typeof l === 'object')
        .map((l) => ({
          name: typeof l.name === 'string' ? l.name : '',
          level: typeof l.level === 'string' ? l.level : '',
        }))
        .filter((l) => l.name.trim())
    : []

  const wordingRaw =
    obj.wording && typeof obj.wording === 'object'
      ? (obj.wording as Record<string, unknown>)
      : {}

  const assetsRaw =
    obj.assets && typeof obj.assets === 'object'
      ? (obj.assets as Record<string, unknown>)
      : {}

  const asOptionalPath = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() ? v.trim() : null

  const content: MasterProfileContent = {
    personal: {
      ...EMPTY_MASTER_PROFILE_PERSONAL,
      ...personal,
      links: { ...EMPTY_MASTER_PROFILE_PERSONAL.links, ...personal.links },
    },
    skills,
    hard_skills,
    soft_skills,
    projects,
    stations,
    education,
    languages,
    interests: asStringArray(obj.interests),
    blog_topics: asStringArray(obj.blog_topics),
    wording: {
      tone: typeof wordingRaw.tone === 'string' ? wordingRaw.tone : '',
      summary: typeof wordingRaw.summary === 'string' ? wordingRaw.summary : '',
      keywords: asStringArray(wordingRaw.keywords),
      hero_badge: typeof wordingRaw.hero_badge === 'string' ? wordingRaw.hero_badge : '',
      hero_subline: typeof wordingRaw.hero_subline === 'string' ? wordingRaw.hero_subline : '',
      hero_headline: typeof wordingRaw.hero_headline === 'string' ? wordingRaw.hero_headline : '',
    },
    assets: {
      cv_pdf: asOptionalPath(assetsRaw.cv_pdf),
      photo: asOptionalPath(assetsRaw.photo),
      signature: asOptionalPath(assetsRaw.signature),
    },
  }

  return syncDerivedSkillLists(content)
}

/** Level 0–100 → 1–5 Sterne (für Anzeige). */
export function levelToStars(level: number): number {
  return Math.min(5, Math.max(1, Math.round(clampLevel(level) / 20))) || 1
}

export function starsToLevel(stars: number): number {
  return clampLevel(Math.min(5, Math.max(1, Math.round(stars))) * 20)
}
