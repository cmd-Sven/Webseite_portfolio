import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth, type AuthErrorCode } from '../context/AuthContext'
import { ADMIN_EMAIL } from '../lib/adminAuth'
import { getDevAdminCredentials } from '../lib/devAdminLogin'
import { DevAdminQuickLogin } from './DevAdminQuickLogin'

function errorText(code: AuthErrorCode | undefined, fallback?: string): string {
  switch (code) {
    case 'config':
      return 'Supabase ist nicht konfiguriert. Bitte Env-Variablen setzen.'
    case 'credentials':
      return 'E-Mail oder Passwort ist falsch.'
    case 'not_admin':
      return 'Dieser Account hat keinen Admin-Zugriff.'
    default:
      return fallback || 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.'
  }
}

function initialDevPassword(): string {
  return getDevAdminCredentials()?.password ?? ''
}

interface AdminLoginModalProps {
  onClose: () => void
}

export function AdminLoginModal({ onClose }: AdminLoginModalProps) {
  const { signIn, configured } = useAuth()
  const navigate = useNavigate()
  const titleId = useId()
  const emailRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState(ADMIN_EMAIL || '')
  const [password, setPassword] = useState(initialDevPassword)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function authenticate(nextEmail: string, nextPassword: string) {
    setError(null)
    setSubmitting(true)

    const result = await signIn(nextEmail, nextPassword)
    setSubmitting(false)

    if (!result.ok) {
      setError(errorText(result.errorCode, result.message))
      return
    }

    onClose()
    navigate('/admin')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await authenticate(email, password)
  }

  function handleQuickLogin(nextEmail: string, nextPassword: string) {
    setEmail(nextEmail)
    setPassword(nextPassword)
    void authenticate(nextEmail, nextPassword)
  }

  return (
    <div
      className="viewport-modal-overlay flex items-center justify-center p-4 md:p-10 backdrop-blur-xl bg-slate-950/80 animate-fadeIn pointer-events-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-mono">
              Personal ATS
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-tight text-slate-100">
              Admin-Login
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors shrink-0"
            aria-label="Schließen"
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="px-5 pb-5 space-y-4">
          {!configured && (
            <div
              role="alert"
              className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-amber-200"
            >
              Bitte VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY und VITE_ADMIN_EMAIL in
              .env.local setzen.
            </div>
          )}

          <DevAdminQuickLogin
            variant="dark"
            disabled={submitting || !configured}
            onQuickLogin={handleQuickLogin}
          />

          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">E-Mail</span>
            <input
              ref={emailRef}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Passwort</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || !configured}
            className="w-full rounded-md bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-950 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Wird angemeldet …' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
