import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'

import type { ConversationItem } from './data'

interface ConversationRow {
  id: string
  status: 'abierta' | 'cerrada'
  last_message_at: string | null
  contacts: { id: string; name: string } | null
  channels: { type: 'whatsapp' | 'instagram' | 'messenger' } | null
}

export function useConversations() {
  const { t } = useTranslation()
  const { tenantId } = useAuth()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)

  const loadConversations = useCallback(async () => {
    if (!tenantId) return
    if (!hasLoadedOnce.current) setLoading(true)

    const { data: conversationRows, error } = await supabase
      .from('conversations')
      .select('id, status, last_message_at, contacts ( id, name ), channels ( type )')
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error || !conversationRows) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar conversaciones:', error?.message)
      setConversations([])
      setError(t('crm.messages.loadError'))
      setLoading(false)
      hasLoadedOnce.current = true
      return
    }
    setError(null)

    const rows = conversationRows as unknown as ConversationRow[]
    const conversationIds = rows.map((row) => row.id)

    const { data: lastMessages } = conversationIds.length
      ? await supabase
          .from('messages')
          .select('conversation_id, content, created_at')
          .eq('tenant_id', tenantId)
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
      : { data: [] as { conversation_id: string; content: string | null }[] }

    const lastMessageByConversation = new Map<string, string | null>()
    for (const message of lastMessages || []) {
      if (!lastMessageByConversation.has(message.conversation_id)) {
        lastMessageByConversation.set(message.conversation_id, message.content)
      }
    }

    setConversations(
      rows.map((row) => ({
        id: row.id,
        contactId: row.contacts?.id || null,
        contactName: row.contacts?.name || t('crm.messages.unknownContact'),
        channelType: row.channels?.type || 'whatsapp',
        lastMessage: lastMessageByConversation.get(row.id) || null,
        lastMessageAt: row.last_message_at,
        status: row.status,
      }))
    )
    setLoading(false)
    hasLoadedOnce.current = true
  }, [tenantId, t])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Realtime: si llega un mensaje nuevo (aunque sea de una conversación que
  // no está abierta ahora mismo) o se crea/actualiza una conversación, hay
  // que refrescar la lista — si no, el panel izquierdo (con el último
  // mensaje y el orden por fecha) solo se actualiza al recargar la página.
  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel(`conversations-list-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `tenant_id=eq.${tenantId}` },
        () => loadConversations()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `tenant_id=eq.${tenantId}` },
        () => loadConversations()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, loadConversations])

  return { conversations, loading, error, reload: loadConversations }
}
