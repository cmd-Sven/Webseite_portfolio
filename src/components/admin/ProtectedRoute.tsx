import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, isAdmin, configured } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-shell min-h-screen flex items-center justify-center bg-zinc-100 text-zinc-600">
        <p className="text-sm tracking-wide">Sitzung wird geprüft …</p>
      </div>
    )
  }

  if (!configured || !isAdmin) {
    // Hash mitnehmen (Bookmarklet-Payload-Backup #ats_pool=…)
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/admin/login" replace state={{ from: returnTo }} />
  }

  return children
}
