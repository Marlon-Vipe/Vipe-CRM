import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'

export interface DealsByStage {
  stageId: string
  stageName: string
  count: number
}

export interface UpcomingActivity {
  id: string
  type: string
  status: string
  dueAt: string | null
  contactName: string | null
}

interface DashboardStats {
  newLeadsCount: number
  activePropertiesCount: number
  openDealsCount: number
  pendingActivitiesCount: number
  dealsByStage: DealsByStage[]
  upcomingActivities: UpcomingActivity[]
}

const EMPTY_STATS: DashboardStats = {
  newLeadsCount: 0,
  activePropertiesCount: 0,
  openDealsCount: 0,
  pendingActivitiesCount: 0,
  dealsByStage: [],
  upcomingActivities: [],
}

export function useDashboardStats() {
  const { t } = useTranslation()
  const { tenantId } = useAuth()
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    if (!hasLoadedOnce.current) setLoading(true)

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [newLeadsResult, activePropertiesResult, pendingActivitiesResult, stagesResult, dealsResult, activitiesResult] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', sevenDaysAgo),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'disponible'),
      supabase.from('activities').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pendiente'),
      supabase.from('pipeline_stages').select('id, name, sort_order').eq('tenant_id', tenantId).order('sort_order', { ascending: true }),
      supabase.from('deals').select('id, stage_id').eq('tenant_id', tenantId),
      supabase
        .from('activities')
        .select('id, type, status, due_at, contacts ( name )')
        .eq('tenant_id', tenantId)
        .eq('status', 'pendiente')
        .order('due_at', { ascending: true, nullsFirst: false })
        .limit(6),
    ])

    const firstError =
      newLeadsResult.error || activePropertiesResult.error || pendingActivitiesResult.error || stagesResult.error || dealsResult.error || activitiesResult.error
    if (firstError) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar las métricas del dashboard:', firstError.message)
      setError(t('crm.dashboard.loadError'))
      setLoading(false)
      hasLoadedOnce.current = true
      return
    }
    setError(null)

    const { count: newLeadsCount } = newLeadsResult
    const { count: activePropertiesCount } = activePropertiesResult
    const { count: pendingActivitiesCount } = pendingActivitiesResult
    const { data: stageRows } = stagesResult
    const { data: dealRows } = dealsResult
    const { data: activityRows } = activitiesResult

    const dealCountByStage = new Map<string, number>()
    for (const deal of dealRows || []) {
      dealCountByStage.set(deal.stage_id, (dealCountByStage.get(deal.stage_id) || 0) + 1)
    }

    const dealsByStage: DealsByStage[] = (stageRows || []).map((stage) => ({
      stageId: stage.id,
      stageName: stage.name,
      count: dealCountByStage.get(stage.id) || 0,
    }))

    const upcomingActivities: UpcomingActivity[] = ((activityRows || []) as unknown as { id: string; type: string; status: string; due_at: string | null; contacts: { name: string } | null }[]).map(
      (activity) => ({
        id: activity.id,
        type: activity.type,
        status: activity.status,
        dueAt: activity.due_at,
        contactName: activity.contacts?.name || null,
      })
    )

    setStats({
      newLeadsCount: newLeadsCount || 0,
      activePropertiesCount: activePropertiesCount || 0,
      openDealsCount: (dealRows || []).length,
      pendingActivitiesCount: pendingActivitiesCount || 0,
      dealsByStage,
      upcomingActivities,
    })
    setLoading(false)
    hasLoadedOnce.current = true
  }, [tenantId, t])

  useEffect(() => {
    load()
  }, [load])

  return { ...stats, loading, error, reload: load }
}
