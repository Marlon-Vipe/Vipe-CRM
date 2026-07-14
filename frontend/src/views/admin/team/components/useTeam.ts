import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'

import type { MembershipRole, PendingInvitation, TeamMember } from './data'

export function useTeam() {
  const { tenantId } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)

    const [membershipsResult, profilesResult, invitationsResult] = await Promise.all([
      supabase.from('memberships').select('user_id, role').eq('tenant_id', tenantId),
      supabase.from('profiles').select('id, full_name, email').eq('tenant_id', tenantId),
      supabase
        .from('invitations')
        .select('id, email, role, token, expires_at')
        .eq('tenant_id', tenantId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
    ])

    const firstError = membershipsResult.error || profilesResult.error || invitationsResult.error
    if (firstError) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar el equipo:', firstError.message)
      setError('No se pudo cargar el equipo. Intenta de nuevo.')
      setLoading(false)
      return
    }
    setError(null)

    const { data: memberships } = membershipsResult
    const { data: profiles } = profilesResult
    const { data: invitationRows } = invitationsResult

    const profileById = new Map((profiles || []).map((p) => [p.id, p]))

    setMembers(
      (memberships || []).map((m) => ({
        userId: m.user_id,
        role: m.role as MembershipRole,
        fullName: profileById.get(m.user_id)?.full_name || null,
        email: profileById.get(m.user_id)?.email || '—',
      }))
    )

    setInvitations(
      (invitationRows || []).map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role as MembershipRole,
        token: inv.token,
        expiresAt: inv.expires_at,
      }))
    )

    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  return { members, invitations, loading, error, reload: load }
}
