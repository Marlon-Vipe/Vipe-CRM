import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import fallbackAvatar from '@/assets/images/users/user-1.jpg'

import type { PipelineSectionType, PipelineTaskType } from './data'

const SECTION_VARIANTS = ['primary', 'info', 'warning', 'success', 'secondary', 'danger'] as const

interface DealRow {
  id: string
  stage_id: string
  contact_id: string
  property_id: string | null
  value_estimate: number | null
  expected_close_date: string | null
  created_at: string
  contacts: { name: string } | null
  properties: { title: string } | null
}

export interface DealContactOption {
  id: string
  name: string
}

export interface DealPropertyOption {
  id: string
  title: string
}

export interface DealFormInput {
  contactId: string
  propertyId: string | null
  stageId: string
  valueEstimate: number | null
  expectedCloseDate: string | null
}

export function useDeals() {
  const { t } = useTranslation()
  const { tenantId, user } = useAuth()
  const [sections, setSections] = useState<PipelineSectionType[]>([])
  const [tasks, setTasks] = useState<PipelineTaskType[]>([])
  const [contactOptions, setContactOptions] = useState<DealContactOption[]>([])
  const [propertyOptions, setPropertyOptions] = useState<DealPropertyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)

  const loadPipeline = useCallback(async () => {
    if (!tenantId) return
    if (!hasLoadedOnce.current) setLoading(true)

    const [stagesResult, dealsResult, contactsResult, propertiesResult] = await Promise.all([
      supabase.from('pipeline_stages').select('id, name, sort_order').eq('tenant_id', tenantId).order('sort_order', { ascending: true }),
      supabase
        .from('deals')
        .select(
          'id, stage_id, contact_id, property_id, value_estimate, expected_close_date, created_at, contacts ( name ), properties ( title )'
        )
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      supabase.from('contacts').select('id, name').eq('tenant_id', tenantId).order('name', { ascending: true }),
      supabase.from('properties').select('id, title').eq('tenant_id', tenantId).order('title', { ascending: true }),
    ])

    const firstError = stagesResult.error || dealsResult.error || contactsResult.error || propertiesResult.error
    if (firstError) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar el pipeline de negociaciones:', firstError.message)
      setError(t('crm.deals.loadError'))
      setLoading(false)
      hasLoadedOnce.current = true
      return
    }
    setError(null)

    const { data: stageRows } = stagesResult
    const { data: dealRows } = dealsResult
    const { data: contactRows } = contactsResult
    const { data: propertyRows } = propertiesResult

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
        title: deal.properties?.title || t('crm.deals.noPropertyTitle'),
        user: fallbackAvatar,
        userName: deal.contacts?.name || t('crm.deals.noContact'),
        company: deal.properties?.title || t('crm.deals.noPropertyAssociated'),
        date: deal.expected_close_date || deal.created_at.slice(0, 10),
        amount: deal.value_estimate || 0,
        contactId: deal.contact_id,
        propertyId: deal.property_id,
        valueEstimate: deal.value_estimate,
        expectedCloseDate: deal.expected_close_date,
      }))
    )

    setContactOptions(contactRows || [])
    setPropertyOptions(propertyRows || [])
    setLoading(false)
    hasLoadedOnce.current = true
  }, [tenantId, t])

  useEffect(() => {
    loadPipeline()
  }, [loadPipeline])

  const updateDealStage = useCallback(
    async (dealId: string, stageId: string) => {
      if (!tenantId) return { error: t('crm.deals.missingTenant') }
      const { error } = await supabase.from('deals').update({ stage_id: stageId }).eq('id', dealId).eq('tenant_id', tenantId)
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error al mover la negociación de etapa:', error.message)
        return { error: t('crm.deals.moveStageError') }
      }
      // No se duplica el registro en deal_stage_history: el trigger
      // log_deal_stage_change de la base de datos ya lo hace (ver crm_schema.sql).
      return {}
    },
    [tenantId, t]
  )

  const createDeal = useCallback(
    async (input: DealFormInput) => {
      if (!tenantId) return { error: t('crm.deals.missingTenant') }
      const { error } = await supabase.from('deals').insert({
        tenant_id: tenantId,
        contact_id: input.contactId,
        property_id: input.propertyId,
        stage_id: input.stageId,
        value_estimate: input.valueEstimate,
        expected_close_date: input.expectedCloseDate,
        assigned_agent_id: user?.id,
      })
      if (!error) await loadPipeline()
      return { error: error?.message }
    },
    [tenantId, user, loadPipeline, t]
  )

  const updateDeal = useCallback(
    async (dealId: string, input: DealFormInput) => {
      if (!tenantId) return { error: t('crm.deals.missingTenant') }
      const { error } = await supabase
        .from('deals')
        .update({
          contact_id: input.contactId,
          property_id: input.propertyId,
          stage_id: input.stageId,
          value_estimate: input.valueEstimate,
          expected_close_date: input.expectedCloseDate,
        })
        .eq('id', dealId)
        .eq('tenant_id', tenantId)
      if (!error) await loadPipeline()
      return { error: error?.message }
    },
    [tenantId, loadPipeline, t]
  )

  const deleteDeal = useCallback(
    async (dealId: string) => {
      if (!tenantId) return { error: t('crm.deals.missingTenant') }
      const { error } = await supabase.from('deals').delete().eq('id', dealId).eq('tenant_id', tenantId)
      if (!error) await loadPipeline()
      return { error: error?.message }
    },
    [tenantId, loadPipeline, t]
  )

  const createStage = useCallback(
    async (name: string) => {
      if (!tenantId) return { error: t('crm.deals.missingTenant') }
      const { error } = await supabase.from('pipeline_stages').insert({ tenant_id: tenantId, name, sort_order: sections.length })
      if (!error) await loadPipeline()
      return { error: error?.message }
    },
    [tenantId, sections, loadPipeline, t]
  )

  const updateStage = useCallback(
    async (stageId: string, name: string) => {
      if (!tenantId) return { error: t('crm.deals.missingTenant') }
      const { error } = await supabase.from('pipeline_stages').update({ name }).eq('id', stageId).eq('tenant_id', tenantId)
      if (!error) await loadPipeline()
      return { error: error?.message }
    },
    [tenantId, loadPipeline, t]
  )

  const deleteStage = useCallback(
    async (stageId: string) => {
      if (!tenantId) return { error: t('crm.deals.missingTenant') }
      const hasDeals = tasks.some((task) => task.sectionId === stageId)
      if (hasDeals) {
        return { error: t('crm.deals.cannotDeleteStageWithDeals') }
      }
      const { error } = await supabase.from('pipeline_stages').delete().eq('id', stageId).eq('tenant_id', tenantId)
      if (!error) await loadPipeline()
      return { error: error?.message }
    },
    [tenantId, tasks, loadPipeline, t]
  )

  return {
    sections,
    tasks,
    contactOptions,
    propertyOptions,
    loading,
    error,
    updateDealStage,
    createDeal,
    updateDeal,
    deleteDeal,
    createStage,
    updateStage,
    deleteStage,
    reload: loadPipeline,
  }
}
