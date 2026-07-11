import { useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'

import type { MessageItem } from './data'

export function useMessages(conversationId: string | null) {
  const { tenantId } = useAuth()
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !conversationId) {
      setMessages([])
      return
    }
    let isMounted = true

    async function loadMessages() {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('id, direction, content, type, created_at')
        .eq('tenant_id', tenantId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!isMounted) return
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error al cargar mensajes:', error.message)
        setMessages([])
      } else {
        setMessages(
          (data || []).map((row) => ({
            id: row.id,
            direction: row.direction,
            content: row.content,
            type: row.type,
            createdAt: row.created_at,
          }))
        )
      }
      setLoading(false)
    }

    loadMessages()

    // Realtime: refleja mensajes nuevos de esta conversación sin recargar (sección 5 del prompt).
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as {
            id: string
            direction: 'entrante' | 'saliente'
            content: string | null
            type: string
            created_at: string
          }
          setMessages((prev) => [...prev, { id: row.id, direction: row.direction, content: row.content, type: row.type, createdAt: row.created_at }])
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [tenantId, conversationId])

  return { messages, loading }
}
