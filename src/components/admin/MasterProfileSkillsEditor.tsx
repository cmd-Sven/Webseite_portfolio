import { Plus, Star, Trash2 } from 'lucide-react'
import { levelToStars } from '../../lib/atsMatching'
import type { MasterProfileSkill, MasterProfileSkillType } from '../../types/ats'

type Props = {
  skills: MasterProfileSkill[]
  onChange: (skills: MasterProfileSkill[]) => void
}

const CATEGORIES = [
  'Design',
  'Frontend',
  'Backend',
  'Data/AI',
  'CMS',
  'Tools',
  'Soft Skills',
  'Allgemein',
] as const

const TYPES: { value: MasterProfileSkillType; label: string }[] = [
  { value: 'hard', label: 'Hard' },
  { value: 'tool', label: 'Tool' },
  { value: 'soft', label: 'Soft' },
]

function emptySkill(): MasterProfileSkill {
  return { name: '', category: 'Frontend', level: 70, type: 'hard' }
}

function StarRow({ level, onPick }: { level: number; onPick: (stars: number) => void }) {
  const active = levelToStars(level)
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`Stufe ${active} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPick(n)}
          className="p-0.5 text-amber-500 hover:text-amber-600"
          aria-label={`${n} Sterne`}
          aria-pressed={n <= active}
        >
          <Star
            className={`w-3.5 h-3.5 ${n <= active ? 'fill-amber-400' : 'fill-transparent text-zinc-300'}`}
          />
        </button>
      ))}
    </div>
  )
}

export function MasterProfileSkillsEditor({ skills, onChange }: Props) {
  const categories = Array.from(
    new Set([...CATEGORIES, ...skills.map((s) => s.category).filter(Boolean)]),
  )

  function update(index: number, patch: Partial<MasterProfileSkill>) {
    onChange(skills.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const grouped = categories
    .map((cat) => ({
      cat,
      items: skills
        .map((s, index) => ({ s, index }))
        .filter(({ s }) => s.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Skills</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Level als Prozent (0–100), Sterne visualisieren ~20 % pro Stern.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...skills, emptySkill()])}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          Skill
        </button>
      </div>

      {skills.length === 0 && (
        <p className="text-sm text-zinc-400">Noch keine Skills — aus Portfolio übernehmen oder hinzufügen.</p>
      )}

      <ul className="space-y-5 list-none p-0 m-0">
        {grouped.map(({ cat, items }) => (
          <li key={cat} className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{cat}</p>
            <ul className="space-y-2 list-none p-0 m-0">
              {items.map(({ s, index }) => (
                <li
                  key={`${cat}-${index}`}
                  className="rounded-md border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={s.name}
                      onChange={(e) => update(index, { name: e.target.value })}
                      placeholder="Skill-Name"
                      className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    />
                    <select
                      value={s.category}
                      onChange={(e) => update(index, { category: e.target.value })}
                      className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      value={s.type}
                      onChange={(e) =>
                        update(index, { type: e.target.value as MasterProfileSkillType })
                      }
                      className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    >
                      {TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={s.level}
                        onChange={(e) => update(index, { level: Number(e.target.value) })}
                        className="w-24 accent-zinc-800"
                        aria-label={`Level ${s.name || 'Skill'}`}
                      />
                      <span className="text-xs tabular-nums text-zinc-600 w-9">{s.level}%</span>
                    </div>
                    <StarRow
                      level={s.level}
                      onPick={(stars) => update(index, { level: stars * 20 })}
                    />
                    <button
                      type="button"
                      onClick={() => onChange(skills.filter((_, i) => i !== index))}
                      className="text-zinc-400 hover:text-red-600"
                      aria-label="Skill entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
