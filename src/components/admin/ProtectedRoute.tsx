import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  /** Welche Rolle die Route braucht. Default: admin. */
  require?: 'admin' | 'monitor' | 'any'
}

export function ProtectedRoute({
  children,
  require = 'admin',
}: ProtectedRouteProps) {
  const { loading, isAdmin, isMonitor, role, configured, homePath } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-shell min-h-screen flex items-center justify-center bg-zinc-100 text-zinc-600">
        <p className="text-sm tracking-wide">Sitzung wird geprüft …</p>
      </div>
    )
  }

  const returnTo = `${location.pathname}${location.search}${location.hash}`

  if (!configured || !role) {
    return <Navigate to="/admin/login" replace state={{ from: returnTo }} />
  }

  if (require === 'admin' && !isAdmin) {
    // Monitor darf Admin-Seiten nicht sehen
    return <Navigate to={isMonitor ? '/monitor' : homePath} replace />
  }

  if (require === 'monitor' && !isMonitor) {
    return <Navigate to={isAdmin ? '/admin' : homePath} replace />
  }

  // require === 'any': Admin oder Monitor
  if (require === 'any' && !isAdmin && !isMonitor) {
    return <Navigate to="/admin/login" replace state={{ from: returnTo }} />
  }

  return children
}
