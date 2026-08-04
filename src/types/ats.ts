/** Status-Werte für Bewerbungen (Kanban-Spalten). */
export const APPLICATION_STATUSES = [
  'Gefunden',
  'In Bearbeitung',
  'Beworben',
  'Interview',
  'Absage',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export type SkillRequirementType = 'hard' | 'soft'
export type SkillRequirementPriority = 'must' | 'nice'

export type SkillRequirement = {
  skill: string
  type: SkillRequirementType
  priority: SkillRequirementPriority
}

export type MasterProfileSkillType = 'hard' | 'soft' | 'tool'

export type MasterProfileSkill = {
  name: string
  /** z. B. Design, Frontend, Backend, Data/AI, CMS, Tools, Soft Skills */
  category: string
  /** Kompetenz 0–100 (UI: Prozent + Sterne-Visualisierung) */
  level: number
  type: MasterProfileSkillType
}

export type MasterProfileProject = {
  name: string
  description?: string
  tech?: string[]
  /** optional: Portfolio-Case-Study-ID */
  portfolio_id?: string
  url?: string
}

export type MasterProfileStation = {
  company: string
  role: string
  from?: string
  to?: string
  highlights?: string[]
}

export type MasterProfileEducation = {
  institution: string
  degree: string
  from?: string
  to?: string
  notes?: string
}

export type MasterProfileLanguage = {
  name: string
  /** z. B. Muttersprache, C1, B2 */
  level: string
}

export type MasterProfilePersonal = {
  name: string
  title: string
  location: string
  email: string
  phone: string
  links: {
    linkedin?: string
    xing?: string
    github?: string
    website?: string
  }
}

export type MasterProfileAssets = {
  /** Storage-Pfad im Bucket master-profile */
  cv_pdf?: string | null
  photo?: string | null
  signature?: string | null
}

export type MasterProfileWording = {
  /** Freitext-Hinweise zum gewünschten Stil (zusätzlich zum Tone-Regler). */
  tone?: string
  summary?: string
  keywords?: string[]
  /** Hero-Badge / Subline / Headline aus dem Portfolio */
  hero_badge?: string
  hero_subline?: string
  hero_headline?: string
}

/** Inhalt des Master-Profils (JSON in master_profile.content). */
export type MasterProfileContent = {
  personal: MasterProfilePersonal
  skills: MasterProfileSkill[]
  /**
   * Abgeleitet aus skills (hard/tool → hard_skills, soft → soft_skills).
   * Bleibt für Matching & Edge Functions rückwärtskompatibel.
   */
  hard_skills: string[]
  soft_skills: string[]
  projects: MasterProfileProject[]
  stations: MasterProfileStation[]
  education: MasterProfileEducation[]
  languages: MasterProfileLanguage[]
  interests: string[]
  /** Blog-Themen / Fokusgebiete */
  blog_topics: string[]
  wording: MasterProfileWording
  assets: MasterProfileAssets
}

export const EMPTY_MASTER_PROFILE_PERSONAL: MasterProfilePersonal = {
  name: '',
  title: '',
  location: '',
  email: '',
  phone: '',
  links: {},
}

export const EMPTY_MASTER_PROFILE_CONTENT: MasterProfileContent = {
  personal: { ...EMPTY_MASTER_PROFILE_PERSONAL, links: {} },
  skills: [],
  hard_skills: [],
  soft_skills: [],
  projects: [],
  stations: [],
  education: [],
  languages: [],
  interests: [],
  blog_topics: [],
  wording: {
    tone: '',
    summary: '',
    keywords: [],
    hero_badge: '',
    hero_subline: '',
    hero_headline: '',
  },
  assets: {
    cv_pdf: null,
    photo: null,
    signature: null,
  },
}

export type MasterProfileRow = {
  id: string
  user_id: string
  content: MasterProfileContent
  updated_at: string
}

/** Generierter CV-Inhalt (JSON in applications.generated_cv_data). */
export type GeneratedCvData = {
  tailored_headline?: string
  summary?: string
  highlighted_skills?: string[]
  experience?: Array<{
    company: string
    role: string
    period?: string
    bullets?: string[]
  }>
  projects?: Array<{
    name: string
    description?: string
    tech?: string[]
  }>
}

export type ApplicationRow = {
  id: string
  user_id: string
  company_name: string
  job_title: string
  job_description_raw: string
  status: ApplicationStatus
  /** Zeitpunkt der Bewerbung (gesetzt beim Status „Beworben“) */
  applied_at: string | null
  /** Manuell erfasste Rückmeldung (z. B. aus E-Mail). */
  feedback_notes: string | null
  /** Zeitpunkt der Rückmeldungs-Erfassung. */
  feedback_at: string | null
  match_score: number | null
  parsed_requirements: SkillRequirement[] | null
  generated_cover_letter: string | null
  generated_cv_data: GeneratedCvData | null
  created_at: string
}

export type MatchItemStatus = 'matched' | 'partial' | 'missing'

export type MatchItem = {
  skill: string
  type: SkillRequirementType
  priority: SkillRequirementPriority
  status: MatchItemStatus
  /** Treffer im Profil, falls vorhanden */
  matched_against?: string
}

export type MatchBreakdown = {
  score: number
  matched: MatchItem[]
  partial: MatchItem[]
  missing: MatchItem[]
  items: MatchItem[]
}

/** 0 = locker, 100 = professionell */
export type ToneValue = number

export type AnalyzeJobPostingRequest = {
  job_description_raw: string
  company_name?: string
  source_url?: string
}

export type AnalyzeJobPostingResponse = {
  application: ApplicationRow
  parsed: {
    company_name: string
    job_title: string
    requirements: SkillRequirement[]
  }
}

/** Pool-/Initiativ-Kontext für Dokumentengenerierung (optional im Invoke-Payload). */
export type GenerateApplicationDocsPoolContext = {
  application_type: JobPoolApplicationType
  title?: string | null
  company_name?: string | null
  source_url?: string | null
  links?: JobPoolLink[]
  notes?: string | null
  job_description?: string | null
  company_info?: string | null
  target_notes?: string | null
  /** Nur Metadaten: ob WBS hinterlegt ist (Pfad selbst wird nicht gelesen). */
  wbs_certificate_path?: string | null
}

export type GenerateApplicationDocsRequest = {
  application_id: string
  /** 0 = locker, 100 = professionell */
  tone: ToneValue
  /**
   * Bewerbungstyp. Edge Function nutzt Pool-Eintrag als Fallback,
   * sonst `regular`.
   */
  application_type?: JobPoolApplicationType
  /** Verknüpfter Stellen-Pool – alle Felder + Links für Prompt/Fetch. */
  pool?: GenerateApplicationDocsPoolContext | null
}

export type GenerateApplicationDocsResponse = {
  application: ApplicationRow
  cover_letter: string
  cv_data: GeneratedCvData
  meta?: {
    application_type: JobPoolApplicationType
    fetched_urls: Array<{
      url: string
      label: string | null
      ok: boolean
      error: string | null
    }>
  }
}

export type RewriteCoverBlockRequest = {
  text: string
  instruction?: string
  company_name?: string
  job_title?: string
}

export type RewriteCoverBlockResponse = {
  rewritten: string
}

export const MASTER_PROFILE_STORAGE_BUCKET = 'master-profile'

export type MasterProfileAssetKind = 'cv_pdf' | 'photo' | 'signature'

// ---------------------------------------------------------------------------
// Stellen-Pool & Tagesplanung (Schema-Phase)
// Status bewusst getrennt von APPLICATION_STATUSES / applications.status.
// ---------------------------------------------------------------------------

/** Pool-Lifecycle, unabhängig von Kanban-Status der Bewerbung. */
export const JOB_POOL_STATUSES = [
  'gesammelt',
  'geplant',
  'in_arbeit',
  'erledigt',
] as const

export type JobPoolStatus = (typeof JOB_POOL_STATUSES)[number]

export const JOB_POOL_APPLICATION_TYPES = ['regular', 'initiative'] as const

export type JobPoolApplicationType = (typeof JOB_POOL_APPLICATION_TYPES)[number]

/** Zusätzliche Links neben source_url (JSONB-Array). */
export type JobPoolLink = {
  label?: string
  url: string
}

export type JobPoolRow = {
  id: string
  user_id: string
  application_type: JobPoolApplicationType
  /** Bei regular erwartet; bei initiative optional/nullable. */
  title: string | null
  company_name: string
  status: JobPoolStatus
  source_url: string | null
  links: JobPoolLink[]
  notes: string | null
  /** Stellenbeschreibung (vor allem regular). */
  job_description: string | null
  /** Initiativ: Unternehmensinformationen. */
  company_info: string | null
  /** Initiativ: Zielbereich-Notizen. */
  target_notes: string | null
  /**
   * Storage-Pfad im Bucket ats-documents,
   * typisch: `{user_id}/wbs/{job_pool_id}.pdf`
   */
  wbs_certificate_path: string | null
  /** Gesetzte Bewerbung, sobald aus dem Pool erzeugt. */
  application_id: string | null
  created_at: string
  updated_at: string
}

export const APPLICATION_PLAN_SLOT_STATUSES = [
  'offen',
  'zugewiesen',
  'erledigt',
  'uebersprungen',
] as const

export type ApplicationPlanSlotStatus =
  (typeof APPLICATION_PLAN_SLOT_STATUSES)[number]

export type ApplicationPlanSlotRow = {
  id: string
  user_id: string
  /** Konkretes Kalenderdatum (YYYY-MM-DD). Mehrere Slots pro Tag möglich. */
  plan_date: string
  /** Reihenfolge am selben plan_date (0-basiert). Unique mit user_id + plan_date. */
  sort_order: number
  /** Optionales UI-Label, z. B. „Tag 1“. */
  label: string | null
  job_pool_id: string | null
  status: ApplicationPlanSlotStatus
  notes: string | null
  created_at: string
}

export const ATS_DOCUMENTS_STORAGE_BUCKET = 'ats-documents'

/** Hilfsfunktion für WBS-Pfad-Konvention (Client-seitig). */
export function atsWbsCertificatePath(
  userId: string,
  jobPoolId: string,
): string {
  return `${userId}/wbs/${jobPoolId}.pdf`
}

// ---------------------------------------------------------------------------
// Monitor-Vorschläge (Stellen + Unternehmen)
// ---------------------------------------------------------------------------

export const JOB_SUGGESTION_STATUSES = ['neu', 'uebernommen', 'abgelehnt'] as const
export type JobSuggestionStatus = (typeof JOB_SUGGESTION_STATUSES)[number]

export type JobSuggestionRow = {
  id: string
  suggested_by: string
  title: string
  company_name: string
  source_url: string | null
  notes: string | null
  job_description_raw: string | null
  status: JobSuggestionStatus
  job_pool_id: string | null
  created_at: string
  updated_at: string
}

export const COMPANY_SUGGESTION_STATUSES = ['neu', 'gesehen', 'archiviert'] as const
export type CompanySuggestionStatus = (typeof COMPANY_SUGGESTION_STATUSES)[number]

export type CompanySuggestionRow = {
  id: string
  suggested_by: string
  company_name: string
  company_url: string
  notes: string | null
  status: CompanySuggestionStatus
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Interessante Unternehmen (Verzeichnis + Timeline)
// ---------------------------------------------------------------------------

export const COMPANY_EVENT_TYPES = [
  'created_manual',
  'suggested',
  'pool_collected',
  'pool_planned',
  'pool_in_progress',
  'pool_done',
  'application_created',
  'application_sent',
  'feedback',
  'interview',
  'rejection',
  'note',
] as const

export type CompanyEventType = (typeof COMPANY_EVENT_TYPES)[number]

export type InterestingCompanyRow = {
  id: string
  user_id: string
  name: string
  website_url: string | null
  normalized_name: string
  notes: string | null
  last_contact_at: string | null
  created_at: string
  updated_at: string
}

export type CompanyEventRow = {
  id: string
  company_id: string
  event_type: CompanyEventType
  ref_table: string | null
  ref_id: string | null
  payload: Record<string, unknown>
  note: string | null
  created_by: string | null
  created_at: string
}

export type CompanyBadges = {
  /** Offene Pool-Stelle / geplante oder laufende Bewerbung */
  active: boolean
  /** Schon mal beworben (Beworben/Interview/Absage oder applied_at) */
  appliedBefore: boolean
  /** Vorschlag von Monitor (Caro) */
  fromSuggestion: boolean
  /** Rückmeldung vorhanden */
  hasFeedback: boolean
}

export type InterestingCompanyWithBadges = InterestingCompanyRow & {
  badges: CompanyBadges
}
