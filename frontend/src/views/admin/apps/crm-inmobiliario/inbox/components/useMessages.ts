import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { sendConversationMessage } from '@/lib/api'

import type { MessageItem } from './data'

export function useMessages(conversationId: string | null) {
  const { tenantId, session } = useAuth()
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

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

  // No se agrega el mensaje al estado local aquí: se inserta desde el
  // backend y llega de vuelta por la suscripción de Realtime de arriba,
  // igual que los mensajes entrantes.
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !session) return
      setSending(true)
      try {
        await sendConversationMessage({ accessToken: session.access_token, conversationId, content })
      } finally {
        setSending(false)
      }
    },
    [conversationId, session]
  )

  return { messages, loading, sending, sendMessage }
}
