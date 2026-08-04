import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import {
  ADMIN_EMAIL,
  MONITOR_EMAIL,
  homePathForRole,
  isAllowedAtsUser,
  isSupabaseConfigured,
  resolveAppRole,
  type AppRole,
} from '../lib/adminAuth'

export type AuthErrorCode = 'config' | 'credentials' | 'not_allowed' | 'unknown'

interface SignInResult {
  ok: boolean
  role?: AppRole | null
  errorCode?: AuthErrorCode
  message?: string
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  role: AppRole | null
  isAdmin: boolean
  isMonitor: boolean
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
  homePath: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** signOut darf nicht direkt im onAuthStateChange-Callback awaited werden (Deadlock). */
function deferredLocalSignOut() {
  setTimeout(() => {
    void supabase.auth.signOut({ scope: 'local' })
  }, 0)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    let active = true

    const applySession = (nextSession: Session | null) => {
      const nextUser = nextSession?.user ?? null
      if (nextUser && !resolveAppRole(nextUser)) {
        setSession(null)
        setUser(null)
        deferredLocalSignOut()
        return
      }
      setSession(nextSession)
      setUser(nextUser)
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      applySession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      applySession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [configured])

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (!configured || (!ADMIN_EMAIL && !MONITOR_EMAIL)) {
        return {
          ok: false,
          errorCode: 'config',
          message: 'Supabase oder ATS-E-Mails sind nicht konfiguriert.',
        }
      }

      const normalizedEmail = email.trim().toLowerCase()

      if (!isAllowedAtsUser(normalizedEmail)) {
        return {
          ok: false,
          errorCode: 'not_allowed',
          message: 'Dieser Account hat keinen ATS-Zugriff.',
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        const lower = error.message.toLowerCase()
        const isInvalid =
          lower.includes('invalid login') ||
          lower.includes('invalid credentials') ||
          error.status === 400

        return {
          ok: false,
          errorCode: isInvalid ? 'credentials' : 'unknown',
          message: isInvalid
            ? 'E-Mail oder Passwort ist falsch.'
            : error.message || 'Anmeldung fehlgeschlagen.',
        }
      }

      const role = resolveAppRole(data.user)
      if (!role) {
        await supabase.auth.signOut({ scope: 'local' })
        return {
          ok: false,
          errorCode: 'not_allowed',
          message: 'Dieser Account hat keinen ATS-Zugriff.',
        }
      }

      return { ok: true, role }
    },
    [configured],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' })
  }, [])

  const role = resolveAppRole(user)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      role,
      isAdmin: role === 'admin',
      isMonitor: role === 'monitor',
      loading,
      configured,
      signIn,
      signOut,
      homePath: homePathForRole(role),
    }),
    [session, user, role, loading, configured, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
