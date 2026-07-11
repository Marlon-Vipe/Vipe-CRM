/**
 * Contexto de autenticación — sesión de Supabase Auth + membresía (tenant/rol)
 * del usuario autenticado. Todas las pantallas protegidas del CRM leen de aquí
 * (vía el hook `useAuth`) en vez de llamar a supabase.auth directamente.
 */

import { createContext, use, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabaseClient'
import { completeSignup } from '@/lib/api'
import { getPendingTenantName, clearPendingTenantName } from '@/lib/pendingTenant'

export type MembershipRole = 'owner' | 'admin' | 'agent'

export interface Tenant {
  name: string
  plan: string
  status: string
}

interface Membership {
  tenant_id: string
  role: MembershipRole
  tenants: Tenant | null
}

export interface AuthContextValue {
  session: Session | null
  user: User | null
  tenantId: string | null
  role: MembershipRole | null
  tenant: Tenant | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (
    email: string,
    password: string,
    options?: { data?: Record<string, unknown> }
  ) => Promise<{ data: { session: Session | null; user: User | null }; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  refreshMembership: () => Promise<Membership | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuthContext = () => {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuthContext solo puede usarse dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  // getSession() y onAuthStateChange pueden disparar casi al mismo tiempo al
  // montar; este ref evita lanzar dos completeSignup en paralelo para el
  // mismo email (la constraint memberships_user_id_unique es el respaldo
  // final, pero esto evita el 500 innecesario en el caso normal).
  const pendingSignupInFlight = useRef(new Set<string>())

  const loadMembership = useCallback(async (userId?: string): Promise<Membership | null> => {
    if (!userId) {
      setMembership(null)
      return null
    }
    const { data, error } = await supabase
      .from('memberships')
      .select('tenant_id, role, tenants ( name, plan, status )')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar la membresía del usuario:', error.message)
      setMembership(null)
      return null
    }
    const typedData = data as unknown as Membership | null
    setMembership(typedData)
    return typedData
  }, [])

  // Si el signup quedó pendiente de confirmación de email, termina de crear
  // el tenant (vía backend) en cuanto detecta una sesión real sin membresía.
  const completePendingSignup = useCallback(
    async (currentSession: Session) => {
      const email = currentSession.user?.email
      if (!email) return

      const pendingTenantName = getPendingTenantName(email)
      if (!pendingTenantName) return

      if (pendingSignupInFlight.current.has(email)) return
      pendingSignupInFlight.current.add(email)

      try {
        await completeSignup({
          accessToken: currentSession.access_token,
          tenantName: pendingTenantName,
        })
        clearPendingTenantName(email)
        await loadMembership(currentSession.user.id)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error al completar el signup pendiente:', (error as Error).message)
      } finally {
        pendingSignupInFlight.current.delete(email)
      }
    },
    [loadMembership]
  )

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return
      setSession(currentSession)
      const currentMembership = await loadMembership(currentSession?.user?.id)
      if (currentSession && !currentMembership) {
        await completePendingSignup(currentSession)
      }
      if (isMounted) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      const currentMembership = await loadMembership(newSession?.user?.id)
      if (newSession && !currentMembership) {
        await completePendingSignup(newSession)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadMembership, completePendingSignup])

  const signIn = useCallback(
    (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    []
  )

  const signUp = useCallback(
    (email: string, password: string, options?: { data?: Record<string, unknown> }) =>
      supabase.auth.signUp({ email, password, options }),
    []
  )

  const signOut = useCallback(() => supabase.auth.signOut(), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      tenantId: membership?.tenant_id ?? null,
      role: membership?.role ?? null,
      tenant: membership?.tenants ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      refreshMembership: () => loadMembership(session?.user?.id),
    }),
    [session, membership, loading, signIn, signUp, signOut, loadMembership]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
