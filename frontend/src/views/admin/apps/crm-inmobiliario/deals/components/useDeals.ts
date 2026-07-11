import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import fallbackAvatar from '@/assets/images/users/user-1.jpg'

import type { PipelineSectionType, PipelineTaskType } from './data'

const SECTION_VARIANTS = ['primary', 'info', 'warning', 'success', 'secondary', 'danger'] as const

interface DealRow {
  id: string
  stage_id: string
  value_estimate: number | null
  expected_close_date: string | null
  created_at: string
  contacts: { name: string } | null
  properties: { title: string } | null
}

export function useDeals() {
  const { tenantId } = useAuth()
  const [sections, setSections] = useState<PipelineSectionType[]>([])
  const [tasks, setTasks] = useState<PipelineTaskType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    let isMounted = true

    async function loadPipeline() {
      setLoading(true)

      const [{ data: stageRows }, { data: dealRows }] = await Promise.all([
        supabase.from('pipeline_stages').select('id, name, sort_order').eq('tenant_id', tenantId).order('sort_order', { ascending: true }),
        supabase
          .from('deals')
          .select('id, stage_id, value_estimate, expected_close_date, created_at, contacts ( name ), properties ( title )')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false }),
      ])

      if (!isMounted) return

      setSections(
        (stageRows || []).map((stage, index) => ({
          id: stage.id,
          title: stage.name,
          variant: SECTION_VARIANTS[index % SECTION_VARIANTS.length],
        }))
      )

      setTasks(
        ((dealRows as unknown as DealRow[]) || []).map((deal) => ({
          id: deal.id,
          sectionId: deal.stage_id,
          title: deal.properties?.title || 'Negociación sin propiedad asociada',
          user: fallbackAvatar,
          userName: deal.contacts?.name || 'Sin contacto',
          company: deal.properties?.title || 'Sin propiedad asociada',
          date: deal.expected_close_date || deal.created_at.slice(0, 10),
          amount: deal.value_estimate || 0,
        }))
      )
      setLoading(false)
    }

    loadPipeline()
    return () => {
      isMounted = false
    }
  }, [tenantId])

  const updateDealStage = useCallback(
    async (dealId: string, stageId: string) => {
      if (!tenantId) return
      const { error } = await supabase.from('deals').update({ stage_id: stageId }).eq('id', dealId).eq('tenant_id', tenantId)
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error al mover la negociación de etapa:', error.message)
      }
      // No se duplica el registro en deal_stage_history: el trigger
      // log_deal_stage_change de la base de datos ya lo hace (ver crm_schema.sql).
    },
    [tenantId]
  )

  return { sections, tasks, loading, updateDealStage }
}
