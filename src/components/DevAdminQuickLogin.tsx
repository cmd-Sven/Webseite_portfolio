import {
  getDevAdminCredentials,
  getDevMonitorCredentials,
} from '../lib/devAdminLogin'

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
  const admin = getDevAdminCredentials()
  const monitor = getDevMonitorCredentials()
  if (!admin && !monitor) return null

  const isDark = variant === 'dark'
  const boxClass = isDark
    ? 'rounded-md border border-cyan-500/25 bg-cyan-500/5 px-3 py-2.5 space-y-3'
    : 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 space-y-3'
  const labelClass = isDark
    ? 'text-[10px] uppercase tracking-[0.16em] font-mono text-cyan-400/90'
    : 'text-[10px] uppercase tracking-[0.16em] font-medium text-emerald-700'
  const roleLabelClass = isDark
    ? 'text-[10px] uppercase tracking-[0.14em] font-mono text-slate-400'
    : 'text-[10px] uppercase tracking-[0.14em] font-medium text-zinc-500'
  const bodyClass = isDark ? 'text-xs text-slate-300 space-y-1' : 'text-xs text-zinc-700 space-y-1'
  const monoClass = isDark ? 'font-mono text-slate-200' : 'font-mono text-zinc-800'
  const hintClass = isDark ? 'text-slate-400' : 'text-zinc-500'
  const adminBtnClass = isDark
    ? 'w-full rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
    : 'w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
  const monitorBtnClass = isDark
    ? 'w-full rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
    : 'w-full rounded-md border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
  const dividerClass = isDark ? 'border-t border-cyan-500/15' : 'border-t border-emerald-200'

  return (
    <div className={boxClass}>
      <p className={labelClass}>Nur lokal (Dev)</p>

      {admin && (
        <div className="space-y-2">
          <p className={roleLabelClass}>Admin</p>
          <div className={bodyClass}>
            <p>
              E-Mail: <span className={monoClass}>{admin.email || '—'}</span>
            </p>
            {admin.password ? (
              <p>
                Passwort: <span className={monoClass}>{admin.password}</span>
              </p>
            ) : (
              <p className={hintClass}>
                Passwort fehlt —{' '}
                <span className={monoClass}>VITE_ADMIN_DEV_PASSWORD</span> in{' '}
                <span className={monoClass}>.env.local</span> setzen.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={disabled || !admin.email || !admin.password}
            onClick={() => onQuickLogin(admin.email, admin.password)}
            className={adminBtnClass}
          >
            Als Admin anmelden
          </button>
        </div>
      )}

      {admin && monitor && <div className={dividerClass} />}

      {monitor && (
        <div className="space-y-2">
          <p className={roleLabelClass}>Monitor · Caro</p>
          <div className={bodyClass}>
            <p>
              E-Mail: <span className={monoClass}>{monitor.email || '—'}</span>
            </p>
            {monitor.password ? (
              <p>
                Passwort: <span className={monoClass}>{monitor.password}</span>
              </p>
            ) : (
              <p className={hintClass}>
                Passwort fehlt —{' '}
                <span className={monoClass}>VITE_MONITOR_DEV_PASSWORD</span> in{' '}
                <span className={monoClass}>.env.local</span> setzen.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={disabled || !monitor.email || !monitor.password}
            onClick={() => onQuickLogin(monitor.email, monitor.password)}
            className={monitorBtnClass}
          >
            Als Caro (Monitor) anmelden
          </button>
        </div>
      )}
    </div>
  )
}
