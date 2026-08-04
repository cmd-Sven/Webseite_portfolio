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
import { ADMIN_EMAIL, isAdminEmail, isSupabaseConfigured } from '../lib/adminAuth'

export type AuthErrorCode = 'config' | 'credentials' | 'not_admin' | 'unknown'

interface SignInResult {
  ok: boolean
  errorCode?: AuthErrorCode
  message?: string
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  isAdmin: boolean
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
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
      if (nextUser && !isAdminEmail(nextUser.email)) {
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
      if (!configured || !ADMIN_EMAIL) {
        return {
          ok: false,
          errorCode: 'config',
          message: 'Supabase oder Admin-E-Mail ist nicht konfiguriert.',
        }
      }

      const normalizedEmail = email.trim().toLowerCase()

      if (!isAdminEmail(normalizedEmail)) {
        return {
          ok: false,
          errorCode: 'not_admin',
          message: 'Dieser Account hat keinen Admin-Zugriff.',
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

      if (!isAdminEmail(data.user?.email)) {
        await supabase.auth.signOut({ scope: 'local' })
        return {
          ok: false,
          errorCode: 'not_admin',
          message: 'Dieser Account hat keinen Admin-Zugriff.',
        }
      }

      return { ok: true }
    },
    [configured],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isAdmin: Boolean(user && isAdminEmail(user.email)),
      loading,
      configured,
      signIn,
      signOut,
    }),
    [session, user, loading, configured, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
