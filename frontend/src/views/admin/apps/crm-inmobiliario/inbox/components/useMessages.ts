import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { sendConversationMessage, sendTemplateMessage } from '@/lib/api'

import type { MessageItem } from './data'

const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000

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
      if (!conversationId || !session) {
        throw new Error('No hay una conversación seleccionada o tu sesión expiró. Recarga la página e intenta de nuevo.')
      }
      setSending(true)
      try {
        await sendConversationMessage({ accessToken: session.access_token, conversationId, content })
      } finally {
        setSending(false)
      }
    },
    [conversationId, session]
  )

  const sendTemplate = useCallback(
    async (templateId: string, variables: string[]) => {
      if (!conversationId || !session) {
        throw new Error('No hay una conversación seleccionada o tu sesión expiró. Recarga la página e intenta de nuevo.')
      }
      setSending(true)
      try {
        await sendTemplateMessage({ accessToken: session.access_token, conversationId, templateId, variables })
      } finally {
        setSending(false)
      }
    },
    [conversationId, session]
  )

  // Mismo cálculo que el backend (SERVICE_WINDOW_MS en messages.js): si el
  // último mensaje del contacto tiene más de 24h, WhatsApp exige una
  // plantilla aprobada en vez de texto libre — se calcula acá también para
  // que el composer pueda cambiar de modo sin esperar a que el backend
  // rechace el envío primero.
  const isWithinServiceWindow = useMemo(() => {
    const lastInbound = [...messages].reverse().find((message) => message.direction === 'entrante')
    if (!lastInbound) return false
    return Date.now() - new Date(lastInbound.createdAt).getTime() < SERVICE_WINDOW_MS
  }, [messages])

  return { messages, loading, sending, sendMessage, sendTemplate, isWithinServiceWindow }
}
