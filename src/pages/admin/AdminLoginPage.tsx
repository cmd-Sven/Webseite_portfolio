// Login-Gate: kein geheimes Backdoor, nur Credentials. Kaffee hilft trotzdem.
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { DevAdminQuickLogin } from '../../components/DevAdminQuickLogin'
import { useAuth, type AuthErrorCode } from '../../context/AuthContext'
import { ADMIN_EMAIL, homePathForRole } from '../../lib/adminAuth'
import { getDevAdminCredentials } from '../../lib/devAdminLogin'

function errorText(code: AuthErrorCode | undefined, fallback?: string): string {
  switch (code) {
    case 'config':
      return 'Supabase ist nicht konfiguriert. Bitte Env-Variablen setzen.'
    case 'credentials':
      return 'E-Mail oder Passwort ist falsch.'
    case 'not_allowed':
      return 'Dieser Account hat keinen ATS-Zugriff.'
    default:
      return fallback || 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.'
  }
}

function initialDevPassword(): string {
  return getDevAdminCredentials()?.password ?? ''
}

export function AdminLoginPage() {
  const { signIn, role, loading, configured, homePath } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromState = (location.state as { from?: string } | null)?.from
  const from =
    fromState && fromState !== '/admin/login' ? fromState : null

  const [email, setEmail] = useState(ADMIN_EMAIL || '')
  const [password, setPassword] = useState(initialDevPassword)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflowY = 'auto'
    return () => {
      document.body.style.overflowY = ''
    }
  }, [])

  if (!loading && role) {
    const target =
      from && role === 'admin' && from.startsWith('/admin')
        ? from
        : from && role === 'monitor' && from.startsWith('/monitor')
          ? from
          : homePath
    return <Navigate to={target} replace />
  }

  async function authenticate(nextEmail: string, nextPassword: string) {
    setError(null)
    setSubmitting(true)

    const result = await signIn(nextEmail, nextPassword)
    setSubmitting(false)

    if (!result.ok) {
      setError(errorText(result.errorCode, result.message))
      return
    }

    const dest = homePathForRole(result.role ?? null)
    navigate(dest, { replace: true })
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
    <div className="admin-shell min-h-screen bg-zinc-100 text-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-medium">
            Personal ATS
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Login</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Admin- und Monitor-Zugang.
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4 shadow-sm"
        >
          {!configured && (
            <div
              role="alert"
              className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900"
            >
              Bitte VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY und VITE_ADMIN_EMAIL in
              .env.local setzen.
            </div>
          )}

          <DevAdminQuickLogin
            variant="light"
            disabled={submitting || !configured}
            onQuickLogin={handleQuickLogin}
          />

          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">E-Mail</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Passwort</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || !configured}
            className="w-full rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Wird angemeldet …' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
