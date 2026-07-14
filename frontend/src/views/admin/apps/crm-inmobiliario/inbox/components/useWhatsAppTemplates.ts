import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { listWhatsAppTemplates, type WhatsAppTemplate } from '@/lib/api'

export function useWhatsAppTemplates() {
  const { session } = useAuth()
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      setTemplates(await listWhatsAppTemplates(session.access_token))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar plantillas de WhatsApp:', (error as Error).message)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  return { templates, loading, reload: load }
}
