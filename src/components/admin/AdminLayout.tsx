import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CalendarDays, Inbox, LayoutGrid, LogOut, Plus, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin', end: true, label: 'Bewerbungen', icon: LayoutGrid },
  { to: '/admin/pool', end: false, label: 'Stellen-Pool', icon: Inbox },
  { to: '/admin/plan', end: false, label: 'Planung', icon: CalendarDays },
  { to: '/admin/new', end: false, label: 'Neue Bewerbung', icon: Plus },
  { to: '/admin/profile', end: false, label: 'Master-Profil', icon: UserRound },
] as const

export function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflowY = 'auto'
    return () => {
      document.body.style.overflowY = ''
    }
  }, [])

  async function handleLogout() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell min-h-screen bg-zinc-100 text-zinc-900 flex">
      <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="px-5 py-6 border-b border-zinc-200">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-medium">
            Personal ATS
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">Admin</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Admin-Navigation">
          {navItems.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                ].join(' ')
              }
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-200 space-y-3">
          <p className="text-xs text-zinc-500 truncate" title={user?.email ?? undefined}>
            {user?.email}
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            Abmelden
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
