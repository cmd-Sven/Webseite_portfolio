import { Plus, Trash2 } from 'lucide-react'
import type { GeneratedCvData } from '../../types/ats'

type Props = {
  value: GeneratedCvData
  onChange: (next: GeneratedCvData) => void
}

function emptyExperience() {
  return { company: '', role: '', period: '', bullets: [''] }
}

function emptyProject() {
  return { name: '', description: '', tech: [] as string[] }
}

export function CvDataEditor({ value, onChange }: Props) {
  const experience = value.experience ?? []
  const projects = value.projects ?? []
  const skillsText = (value.highlighted_skills ?? []).join(', ')

  return (
    <div className="space-y-5">
      <p className="text-xs text-zinc-500 leading-relaxed">
        Felder der generierten CV-JSON bearbeiten. Speichern schreibt zurück nach{' '}
        <code className="text-[11px]">generated_cv_data</code>.
      </p>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-600">Headline</span>
        <input
          type="text"
          value={value.tailored_headline ?? ''}
          onChange={(e) => onChange({ ...value, tailored_headline: e.target.value })}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-600">Summary</span>
        <textarea
          value={value.summary ?? ''}
          onChange={(e) => onChange({ ...value, summary: e.target.value })}
          rows={4}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-600">
          Hervorgehobene Skills (kommagetrennt)
        </span>
        <input
          type="text"
          value={skillsText}
          onChange={(e) =>
            onChange({
              ...value,
              highlighted_skills: e.target.value
                .split(/[,;\n]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs uppercase tracking-[0.14em] text-zinc-400 font-medium">
            Erfahrung
          </h4>
          <button
            type="button"
            onClick={() =>
              onChange({ ...value, experience: [...experience, emptyExperience()] })
            }
            className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Station
          </button>
        </div>

        {experience.length === 0 && (
          <p className="text-sm text-zinc-400">Keine Stationen.</p>
        )}

        {experience.map((exp, index) => (
          <div
            key={`exp-${index}`}
            className="rounded-md border border-zinc-200 bg-zinc-50/40 p-3 space-y-2"
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    experience: experience.filter((_, i) => i !== index),
                  })
                }
                className="text-zinc-400 hover:text-red-600"
                aria-label="Station entfernen"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Rolle"
                value={exp.role}
                onChange={(e) => {
                  const next = [...experience]
                  next[index] = { ...exp, role: e.target.value }
                  onChange({ ...value, experience: next })
                }}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <input
                type="text"
                placeholder="Unternehmen"
                value={exp.company}
                onChange={(e) => {
                  const next = [...experience]
                  next[index] = { ...exp, company: e.target.value }
                  onChange({ ...value, experience: next })
                }}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
            <input
              type="text"
              placeholder="Zeitraum"
              value={exp.period ?? ''}
              onChange={(e) => {
                const next = [...experience]
                next[index] = { ...exp, period: e.target.value }
                onChange({ ...value, experience: next })
              }}
              className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <textarea
              placeholder="Bullet Points (eine Zeile pro Punkt)"
              value={(exp.bullets ?? []).join('\n')}
              onChange={(e) => {
                const next = [...experience]
                next[index] = {
                  ...exp,
                  bullets: e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                }
                onChange({ ...value, experience: next })
              }}
              rows={3}
              className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs uppercase tracking-[0.14em] text-zinc-400 font-medium">
            Projekte
          </h4>
          <button
            type="button"
            onClick={() =>
              onChange({ ...value, projects: [...projects, emptyProject()] })
            }
            className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Projekt
          </button>
        </div>

        {projects.length === 0 && (
          <p className="text-sm text-zinc-400">Keine Projekte.</p>
        )}

        {projects.map((project, index) => (
          <div
            key={`proj-${index}`}
            className="rounded-md border border-zinc-200 bg-zinc-50/40 p-3 space-y-2"
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    projects: projects.filter((_, i) => i !== index),
                  })
                }
                className="text-zinc-400 hover:text-red-600"
                aria-label="Projekt entfernen"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
            <input
              type="text"
              placeholder="Name"
              value={project.name}
              onChange={(e) => {
                const next = [...projects]
                next[index] = { ...project, name: e.target.value }
                onChange({ ...value, projects: next })
              }}
              className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <textarea
              placeholder="Beschreibung"
              value={project.description ?? ''}
              onChange={(e) => {
                const next = [...projects]
                next[index] = { ...project, description: e.target.value }
                onChange({ ...value, projects: next })
              }}
              rows={2}
              className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <input
              type="text"
              placeholder="Tech (kommagetrennt)"
              value={(project.tech ?? []).join(', ')}
              onChange={(e) => {
                const next = [...projects]
                next[index] = {
                  ...project,
                  tech: e.target.value
                    .split(/[,;\n]+/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                }
                onChange({ ...value, projects: next })
              }}
              className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
