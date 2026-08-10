import { useEffect, useState, type FormEvent } from 'react'
import { KeyRound, Mail, Save, UserRound } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import {
  displayNameFromUser,
  updateMonitorAccount,
} from '../../lib/atsMonitorApi'

type MonitorProfilePanelProps = {
  user: User | null
  onClose: () => void
  onSaved: (notice: string) => void
}

export function MonitorProfilePanel({
  user,
  onClose,
  onSaved,
}: MonitorProfilePanelProps) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(displayNameFromUser(user))
    setEmail(user?.email ?? '')
    setPassword('')
    setPasswordConfirm('')
    setError(null)
  }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password && password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    const currentEmail = (user?.email ?? '').trim().toLowerCase()
    const nextEmail = email.trim().toLowerCase()
    const currentName = displayNameFromUser(user)

    const patch = {
      displayName:
        displayName.trim() !== currentName ? displayName.trim() : undefined,
      email: nextEmail && nextEmail !== currentEmail ? nextEmail : undefined,
      password: password || undefined,
    }

    if (!patch.displayName && !patch.email && !patch.password) {
      setError('Keine Änderungen zum Speichern.')
      return
    }

    setSaving(true)
    const { error: err, emailChangePending } = await updateMonitorAccount(patch)
    setSaving(false)

    if (err) {
      setError(err)
      return
    }

    setPassword('')
    setPasswordConfirm('')
    onSaved(
      emailChangePending
        ? 'Profil gespeichert. Bitte die neue E-Mail über den Bestätigungslink bestätigen.'
        : 'Profil gespeichert.',
    )
    onClose()
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="monitor-shell__panel p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <UserRound className="w-4 h-4" aria-hidden />
          Profil
        </h2>
        <button
          type="button"
          className="text-xs monitor-shell__muted hover:opacity-80"
          onClick={onClose}
        >
          Schließen
        </button>
      </div>

      <p className="text-xs monitor-shell__muted">
        Nur deine eigenen Zugangsdaten. Änderungen laufen über Supabase Auth.
      </p>

      {error && (
        <div role="alert" className="monitor-shell__alert monitor-shell__alert--danger">
          {error}
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Profilname</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="nickname"
          className="monitor-shell__input"
          placeholder="Anzeigename"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted inline-flex items-center gap-1">
          <Mail className="w-3 h-3" aria-hidden />
          E-Mail
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="monitor-shell__input"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted inline-flex items-center gap-1">
          <KeyRound className="w-3 h-3" aria-hidden />
          Neues Passwort
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="monitor-shell__input"
          placeholder="Leer lassen = unverändert"
          minLength={8}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Passwort bestätigen</span>
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          className="monitor-shell__input"
          disabled={!password}
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="monitor-shell__btn monitor-shell__btn--primary"
      >
        <Save className="w-4 h-4" aria-hidden />
        {saving ? 'Speichern …' : 'Speichern'}
      </button>
    </form>
  )
}
