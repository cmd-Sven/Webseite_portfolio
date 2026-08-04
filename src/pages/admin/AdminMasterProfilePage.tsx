import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Download, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { MasterProfileAssetUpload } from '../../components/admin/MasterProfileAssetUpload'
import { MasterProfileSkillsEditor } from '../../components/admin/MasterProfileSkillsEditor'
import { useAuth } from '../../context/AuthContext'
import { getMasterProfile, saveMasterProfile } from '../../lib/atsApi'
import { syncDerivedSkillLists } from '../../lib/atsMatching'
import {
  buildPortfolioMasterProfileDefaults,
  masterProfileHasContent,
  mergePortfolioDefaults,
  replaceWithPortfolioDefaults,
} from '../../lib/masterProfileDefaults'
import {
  EMPTY_MASTER_PROFILE_CONTENT,
  type MasterProfileContent,
  type MasterProfileEducation,
  type MasterProfileLanguage,
  type MasterProfileProject,
  type MasterProfileStation,
} from '../../types/ats'

function splitList(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function joinList(values: string[]): string {
  return values.join(', ')
}

function emptyProject(): MasterProfileProject {
  return { name: '', description: '', tech: [] }
}

function emptyStation(): MasterProfileStation {
  return { company: '', role: '', from: '', to: '', highlights: [] }
}

function emptyEducation(): MasterProfileEducation {
  return { institution: '', degree: '', from: '', to: '', notes: '' }
}

function emptyLanguage(): MasterProfileLanguage {
  return { name: '', level: '' }
}

const fieldClass =
  'w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400'

export function AdminMasterProfilePage() {
  const { user } = useAuth()
  const [content, setContent] = useState<MasterProfileContent>(EMPTY_MASTER_PROFILE_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const reportError = useCallback((message: string) => {
    setError(message)
    setSuccess(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    void getMasterProfile().then(({ data, error: fetchError }) => {
      if (cancelled) return
      setLoading(false)
      if (fetchError) {
        setError(fetchError)
        return
      }
      if (data) {
        setContent(data.content)
        setUpdatedAt(data.updated_at)
      } else {
        setContent(EMPTY_MASTER_PROFILE_CONTENT)
        setUpdatedAt(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  function patchContent(updater: (prev: MasterProfileContent) => MasterProfileContent) {
    setContent((prev) => syncDerivedSkillLists(updater(prev)))
  }

  function handleImportFromPortfolio() {
    setError(null)
    setSuccess(null)

    if (masterProfileHasContent(content)) {
      const replace = window.confirm(
        'Es sind bereits Profildaten vorhanden.\n\nOK = mit Portfolio-Defaults ersetzen (Uploads bleiben).\nAbbrechen = nur fehlende Felder/Skills ergänzen (Merge).',
      )
      if (replace) {
        setContent(replaceWithPortfolioDefaults(content))
        setSuccess('Portfolio-Defaults übernommen (ersetzt). Bitte speichern.')
        return
      }
      const merge = window.confirm(
        'Fehlende Angaben und Skills aus dem Portfolio ergänzen? Vorhandene Levels und Texte bleiben erhalten.',
      )
      if (!merge) return
      setContent(mergePortfolioDefaults(content))
      setSuccess('Portfolio-Daten ergänzt (Merge). Bitte speichern.')
      return
    }

    setContent(buildPortfolioMasterProfileDefaults())
    setSuccess('Portfolio-Defaults geladen. Bitte speichern.')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user?.id) {
      setError('Nicht angemeldet.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    const { data, error: saveError } = await saveMasterProfile(content, user.id)
    setSaving(false)

    if (saveError) {
      setError(saveError)
      return
    }

    if (data) {
      setContent(data.content)
      setUpdatedAt(data.updated_at)
    }
    setSuccess('Master-Profil gespeichert.')
  }

  function updateProject(index: number, patch: Partial<MasterProfileProject>) {
    patchContent((prev) => ({
      ...prev,
      projects: prev.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }))
  }

  function updateStation(index: number, patch: Partial<MasterProfileStation>) {
    patchContent((prev) => ({
      ...prev,
      stations: prev.stations.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }))
  }

  function updateEducation(index: number, patch: Partial<MasterProfileEducation>) {
    patchContent((prev) => ({
      ...prev,
      education: prev.education.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }))
  }

  function updateLanguage(index: number, patch: Partial<MasterProfileLanguage>) {
    patchContent((prev) => ({
      ...prev,
      languages: prev.languages.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        Lade Master-Profil …
      </div>
    )
  }

  const personal = content.personal

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Master-Profil</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Stammdaten für Matching und Dokumentengenerierung — Skills, Stationen und Wording speisen
            Match-Score und KI-Entwürfe.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleImportFromPortfolio}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-800 hover:bg-zinc-50 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden />
            Aus Portfolio übernehmen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Save className="w-4 h-4" aria-hidden />
            )}
            Speichern
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800"
        >
          {success}
        </div>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-medium text-zinc-900">Persönlich</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Name</span>
            <input
              value={personal.name}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: { ...prev.personal, name: e.target.value },
                }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Titel / Rolle</span>
            <input
              value={personal.title}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: { ...prev.personal, title: e.target.value },
                }))
              }
              className={fieldClass}
              placeholder="Data and Frontend Engineer"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Standort</span>
            <input
              value={personal.location}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: { ...prev.personal, location: e.target.value },
                }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">E-Mail</span>
            <input
              type="email"
              value={personal.email}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: { ...prev.personal, email: e.target.value },
                }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Telefon</span>
            <input
              value={personal.phone}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: { ...prev.personal, phone: e.target.value },
                }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Website</span>
            <input
              value={personal.links.website ?? ''}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    links: { ...prev.personal.links, website: e.target.value },
                  },
                }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">LinkedIn</span>
            <input
              value={personal.links.linkedin ?? ''}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    links: { ...prev.personal.links, linkedin: e.target.value },
                  },
                }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Xing</span>
            <input
              value={personal.links.xing ?? ''}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    links: { ...prev.personal.links, xing: e.target.value },
                  },
                }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs text-zinc-500">GitHub</span>
            <input
              value={personal.links.github ?? ''}
              onChange={(e) =>
                patchContent((prev) => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    links: { ...prev.personal.links, github: e.target.value },
                  },
                }))
              }
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <MasterProfileSkillsEditor
          skills={content.skills}
          onChange={(skills) => patchContent((prev) => ({ ...prev, skills }))}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-zinc-900">Berufserfahrung</h3>
          <button
            type="button"
            onClick={() =>
              patchContent((prev) => ({ ...prev, stations: [...prev.stations, emptyStation()] }))
            }
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Station
          </button>
        </div>

        {content.stations.length === 0 && (
          <p className="text-sm text-zinc-400">
            Noch keine Stationen — nach dem Portfolio-Import manuell ergänzen.
          </p>
        )}

        <ul className="space-y-4 list-none p-0 m-0">
          {content.stations.map((station, index) => (
            <li
              key={`station-${index}`}
              className="rounded-md border border-zinc-100 bg-zinc-50/80 p-4 space-y-3"
            >
              <div className="flex justify-between gap-2">
                <p className="text-xs font-medium text-zinc-400">Station {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchContent((prev) => ({
                      ...prev,
                      stations: prev.stations.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-zinc-400 hover:text-red-600"
                  aria-label="Station entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Unternehmen</span>
                  <input
                    value={station.company}
                    onChange={(e) => updateStation(index, { company: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Rolle</span>
                  <input
                    value={station.role}
                    onChange={(e) => updateStation(index, { role: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Von</span>
                  <input
                    value={station.from ?? ''}
                    onChange={(e) => updateStation(index, { from: e.target.value })}
                    placeholder="2022-01"
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Bis</span>
                  <input
                    value={station.to ?? ''}
                    onChange={(e) => updateStation(index, { to: e.target.value })}
                    placeholder="heute"
                    className={fieldClass}
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Highlights (eine Zeile pro Punkt)</span>
                <textarea
                  rows={2}
                  value={(station.highlights ?? []).join('\n')}
                  onChange={(e) =>
                    updateStation(index, {
                      highlights: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className={fieldClass}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-zinc-900">Projekte</h3>
          <button
            type="button"
            onClick={() =>
              patchContent((prev) => ({ ...prev, projects: [...prev.projects, emptyProject()] }))
            }
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Projekt
          </button>
        </div>

        {content.projects.length === 0 && (
          <p className="text-sm text-zinc-400">Noch keine Projekte hinterlegt.</p>
        )}

        <ul className="space-y-4 list-none p-0 m-0">
          {content.projects.map((project, index) => (
            <li
              key={`project-${index}`}
              className="rounded-md border border-zinc-100 bg-zinc-50/80 p-4 space-y-3"
            >
              <div className="flex justify-between gap-2">
                <p className="text-xs font-medium text-zinc-400">Projekt {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchContent((prev) => ({
                      ...prev,
                      projects: prev.projects.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-zinc-400 hover:text-red-600"
                  aria-label="Projekt entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Name</span>
                <input
                  value={project.name}
                  onChange={(e) => updateProject(index, { name: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Beschreibung</span>
                <textarea
                  rows={2}
                  value={project.description ?? ''}
                  onChange={(e) => updateProject(index, { description: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Tech (kommagetrennt)</span>
                <input
                  value={joinList(project.tech ?? [])}
                  onChange={(e) => updateProject(index, { tech: splitList(e.target.value) })}
                  className={fieldClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">URL (optional)</span>
                <input
                  value={project.url ?? ''}
                  onChange={(e) => updateProject(index, { url: e.target.value })}
                  className={fieldClass}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-zinc-900">Ausbildung & Zertifikate</h3>
          <button
            type="button"
            onClick={() =>
              patchContent((prev) => ({
                ...prev,
                education: [...prev.education, emptyEducation()],
              }))
            }
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Eintrag
          </button>
        </div>
        <ul className="space-y-3 list-none p-0 m-0">
          {content.education.map((edu, index) => (
            <li
              key={`edu-${index}`}
              className="rounded-md border border-zinc-100 bg-zinc-50/80 p-4 space-y-3"
            >
              <div className="flex justify-between">
                <p className="text-xs text-zinc-400">Eintrag {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchContent((prev) => ({
                      ...prev,
                      education: prev.education.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-zinc-400 hover:text-red-600"
                  aria-label="Ausbildung entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Institution</span>
                  <input
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, { institution: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Abschluss / Zertifikat</span>
                  <input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, { degree: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Von</span>
                  <input
                    value={edu.from ?? ''}
                    onChange={(e) => updateEducation(index, { from: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Bis</span>
                  <input
                    value={edu.to ?? ''}
                    onChange={(e) => updateEducation(index, { to: e.target.value })}
                    className={fieldClass}
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Notizen</span>
                <input
                  value={edu.notes ?? ''}
                  onChange={(e) => updateEducation(index, { notes: e.target.value })}
                  className={fieldClass}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-zinc-900">Sprachen</h3>
          <button
            type="button"
            onClick={() =>
              patchContent((prev) => ({
                ...prev,
                languages: [...prev.languages, emptyLanguage()],
              }))
            }
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Sprache
          </button>
        </div>
        <ul className="space-y-2 list-none p-0 m-0">
          {content.languages.map((lang, index) => (
            <li key={`lang-${index}`} className="flex flex-wrap gap-2 items-center">
              <input
                value={lang.name}
                onChange={(e) => updateLanguage(index, { name: e.target.value })}
                placeholder="Sprache"
                className={`${fieldClass} sm:max-w-[180px]`}
              />
              <input
                value={lang.level}
                onChange={(e) => updateLanguage(index, { level: e.target.value })}
                placeholder="Niveau (z. B. C1)"
                className={`${fieldClass} sm:max-w-[160px]`}
              />
              <button
                type="button"
                onClick={() =>
                  patchContent((prev) => ({
                    ...prev,
                    languages: prev.languages.filter((_, i) => i !== index),
                  }))
                }
                className="text-zinc-400 hover:text-red-600"
                aria-label="Sprache entfernen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-medium text-zinc-900">Wording & Hero</h3>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Kurzprofil / Summary</span>
          <textarea
            rows={4}
            value={content.wording.summary ?? ''}
            onChange={(e) =>
              patchContent((prev) => ({
                ...prev,
                wording: { ...prev.wording, summary: e.target.value },
              }))
            }
            className={fieldClass}
            placeholder="Wer du bist, worauf du dich fokussierst …"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Hero-Badge</span>
          <input
            value={content.wording.hero_badge ?? ''}
            onChange={(e) =>
              patchContent((prev) => ({
                ...prev,
                wording: { ...prev.wording, hero_badge: e.target.value },
              }))
            }
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Hero-Subline</span>
          <input
            value={content.wording.hero_subline ?? ''}
            onChange={(e) =>
              patchContent((prev) => ({
                ...prev,
                wording: { ...prev.wording, hero_subline: e.target.value },
              }))
            }
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Hero-Headline</span>
          <input
            value={content.wording.hero_headline ?? ''}
            onChange={(e) =>
              patchContent((prev) => ({
                ...prev,
                wording: { ...prev.wording, hero_headline: e.target.value },
              }))
            }
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">
            Stil-Hinweise (dauerhaft, zusätzlich zum Tone-Regler)
          </span>
          <textarea
            rows={2}
            value={content.wording.tone ?? ''}
            onChange={(e) =>
              patchContent((prev) => ({
                ...prev,
                wording: { ...prev.wording, tone: e.target.value },
              }))
            }
            className={fieldClass}
            placeholder="Klar, konkret, ohne Buzzwords …"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Keywords (kommagetrennt)</span>
          <input
            value={joinList(content.wording.keywords ?? [])}
            onChange={(e) =>
              patchContent((prev) => ({
                ...prev,
                wording: { ...prev.wording, keywords: splitList(e.target.value) },
              }))
            }
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Blog-Themen (kommagetrennt)</span>
          <input
            value={joinList(content.blog_topics)}
            onChange={(e) =>
              patchContent((prev) => ({ ...prev, blog_topics: splitList(e.target.value) }))
            }
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Interessen (kommagetrennt)</span>
          <input
            value={joinList(content.interests)}
            onChange={(e) =>
              patchContent((prev) => ({ ...prev, interests: splitList(e.target.value) }))
            }
            className={fieldClass}
          />
        </label>
      </section>

      {user?.id && (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <MasterProfileAssetUpload
            userId={user.id}
            assets={content.assets}
            onChange={(assets) => patchContent((prev) => ({ ...prev, assets }))}
            onError={reportError}
          />
        </section>
      )}

      {updatedAt && (
        <p className="text-xs text-zinc-400">
          Zuletzt gespeichert:{' '}
          {new Date(updatedAt).toLocaleString('de-DE', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      )}
    </form>
  )
}
