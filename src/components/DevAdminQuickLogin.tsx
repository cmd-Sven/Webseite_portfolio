import { getDevAdminCredentials } from '../lib/devAdminLogin'

type DevAdminQuickLoginProps = {
  variant: 'dark' | 'light'
  disabled?: boolean
  onQuickLogin: (email: string, password: string) => void
}

export function DevAdminQuickLogin({
  variant,
  disabled,
  onQuickLogin,
}: DevAdminQuickLoginProps) {
  const creds = getDevAdminCredentials()
  if (!creds) return null

  const isDark = variant === 'dark'
  const boxClass = isDark
    ? 'rounded-md border border-cyan-500/25 bg-cyan-500/5 px-3 py-2.5 space-y-2'
    : 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 space-y-2'
  const labelClass = isDark
    ? 'text-[10px] uppercase tracking-[0.16em] font-mono text-cyan-400/90'
    : 'text-[10px] uppercase tracking-[0.16em] font-medium text-emerald-700'
  const bodyClass = isDark ? 'text-xs text-slate-300 space-y-1' : 'text-xs text-zinc-700 space-y-1'
  const monoClass = isDark ? 'font-mono text-slate-200' : 'font-mono text-zinc-800'
  const hintClass = isDark ? 'text-slate-400' : 'text-zinc-500'
  const btnClass = isDark
    ? 'w-full rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
    : 'w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

  const canOneClick = Boolean(creds.email && creds.password)

  return (
    <div className={boxClass}>
      <p className={labelClass}>Nur lokal (Dev)</p>
      <div className={bodyClass}>
        <p>
          E-Mail:{' '}
          <span className={monoClass}>{creds.email || '—'}</span>
        </p>
        {creds.password ? (
          <p>
            Passwort:{' '}
            <span className={monoClass}>{creds.password}</span>
          </p>
        ) : (
          <p className={hintClass}>
            Passwort fehlt in Env — bitte manuell eingeben oder{' '}
            <span className={monoClass}>VITE_ADMIN_DEV_PASSWORD</span> in{' '}
            <span className={monoClass}>.env.local</span> setzen.
          </p>
        )}
      </div>
      {canOneClick && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onQuickLogin(creds.email, creds.password)}
          className={btnClass}
        >
          Als Admin einloggen
        </button>
      )}
    </div>
  )
}
