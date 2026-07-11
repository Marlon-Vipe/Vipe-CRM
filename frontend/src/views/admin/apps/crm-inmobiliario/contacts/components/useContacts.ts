import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'

import type { ContactType } from './data'

export function useContacts() {
  const { tenantId } = useAuth()
  const [contacts, setContacts] = useState<ContactType[]>([])
  const [loading, setLoading] = useState(true)

  const loadContacts = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)

    const { data: contactRows, error } = await supabase
      .from('contacts')
      .select('id, name, phone, email, type, source, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error || !contactRows) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar contactos:', error?.message)
      setContacts([])
      setLoading(false)
      return
    }

    const contactIds = contactRows.map((row) => row.id)

    const [{ data: deals }, { data: activities }] = await Promise.all([
      contactIds.length
        ? supabase.from('deals').select('contact_id').eq('tenant_id', tenantId).in('contact_id', contactIds)
        : Promise.resolve({ data: [] as { contact_id: string }[] }),
      contactIds.length
        ? supabase
            .from('activities')
            .select('contact_id')
            .eq('tenant_id', tenantId)
            .eq('status', 'pendiente')
            .in('contact_id', contactIds)
        : Promise.resolve({ data: [] as { contact_id: string | null }[] }),
    ])

    const dealsCountByContact = new Map<string, number>()
    for (const deal of deals || []) {
      dealsCountByContact.set(deal.contact_id, (dealsCountByContact.get(deal.contact_id) || 0) + 1)
    }
    const pendingActivitiesByContact = new Map<string, number>()
    for (const activity of activities || []) {
      if (!activity.contact_id) continue
      pendingActivitiesByContact.set(activity.contact_id, (pendingActivitiesByContact.get(activity.contact_id) || 0) + 1)
    }

    setContacts(
      contactRows.map((row) => ({
        ...row,
        dealsCount: dealsCountByContact.get(row.id) || 0,
        pendingActivitiesCount: pendingActivitiesByContact.get(row.id) || 0,
      }))
    )
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  return { contacts, loading, reload: loadContacts }
}
