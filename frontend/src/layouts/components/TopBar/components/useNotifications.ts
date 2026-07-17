import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'

export type NotificationType = 'new_message' | 'new_lead' | 'invitation_accepted' | 'activity_due'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body: string | null
  metadata: Record<string, string>
  link: string | null
  createdAt: string
  unread: boolean
}

export function useNotifications() {
  const { tenantId, user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const hasLoadedOnce = useRef(false)

  const load = useCallback(async () => {
    if (!tenantId || !user) return
    if (!hasLoadedOnce.current) setLoading(true)

    const nowIso = new Date().toISOString()

    const [{ data: profile }, { data: notifRows }, { data: dueActivities }] = await Promise.all([
      supabase.from('profiles').select('notifications_seen_at').eq('id', user.id).maybeSingle(),
      supabase.from('notifications').select('id, type, title, body, metadata, link, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20),
      supabase
        .from('activities')
        .select('id, type, notes, due_at, contacts ( name )')
        .eq('tenant_id', tenantId)
        .eq('status', 'pendiente')
        .not('due_at', 'is', null)
        .lte('due_at', nowIso)
        .order('due_at', { ascending: true })
        .limit(10),
    ])

    const seenAt = profile?.notifications_seen_at || null

    const stored: NotificationItem[] = (notifRows || []).map((row) => ({
      id: row.id,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      metadata: (row.metadata as Record<string, string>) || {},
      link: row.link,
      createdAt: row.created_at,
      unread: !seenAt || new Date(row.created_at) > new Date(seenAt),
    }))

    // Las actividades vencidas no se "leen" marcando la campanita — solo
    // desaparecen cuando el agente las completa (ya lo hace la pantalla de
    // Contactos/Negociaciones), así que siempre cuentan como pendientes.
    const overdue: NotificationItem[] = ((dueActivities || []) as unknown as { id: string; type: string; notes: string | null; due_at: string; contacts: { name: string } | null }[]).map(
      (activity) => ({
        id: `activity-${activity.id}`,
        type: 'activity_due',
        title: activity.contacts?.name || activity.type,
        body: activity.notes,
        metadata: { activityType: activity.type },
        link: null,
        createdAt: activity.due_at,
        unread: true,
      })
    )

    setNotifications(
      [...overdue, ...stored].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    )
    setLoading(false)
    hasLoadedOnce.current = true
  }, [tenantId, user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!tenantId) return
    const channel = supabase
      .channel(`notifications-${tenantId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `tenant_id=eq.${tenantId}` }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, load])

  const markSeen = useCallback(async () => {
    if (!user) return
    const now = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => (n.type === 'activity_due' ? n : { ...n, unread: false })))
    await supabase.from('profiles').update({ notifications_seen_at: now }).eq('id', user.id)
  }, [user])

  const unreadCount = notifications.filter((n) => n.unread).length

  return { notifications, unreadCount, loading, markSeen, reload: load }
}
