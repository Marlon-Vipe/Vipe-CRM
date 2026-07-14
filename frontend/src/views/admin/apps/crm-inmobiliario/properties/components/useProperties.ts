import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'

import type { PropertyType } from './data'

export function useProperties() {
  const { tenantId } = useAuth()
  const [properties, setProperties] = useState<PropertyType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProperties = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)

    const { data: rows, error } = await supabase
      .from('properties')
      .select('id, title, type, status, price, currency, sector, city, bedrooms, bathrooms, area_m2')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error || !rows) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar propiedades:', error?.message)
      setProperties([])
      setError('No se pudieron cargar las propiedades. Intenta de nuevo.')
      setLoading(false)
      return
    }
    setError(null)

    const propertyIds = rows.map((row) => row.id)
    const { data: images } = propertyIds.length
      ? await supabase
          .from('property_images')
          .select('property_id, url, sort_order')
          .eq('tenant_id', tenantId)
          .in('property_id', propertyIds)
          .order('sort_order', { ascending: true })
      : { data: [] as { property_id: string; url: string }[] }

    const firstImageByProperty = new Map<string, string>()
    for (const image of images || []) {
      if (!firstImageByProperty.has(image.property_id)) {
        firstImageByProperty.set(image.property_id, image.url)
      }
    }

    setProperties(
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        status: row.status,
        price: row.price,
        currency: row.currency,
        sector: row.sector,
        city: row.city,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        areaM2: row.area_m2,
        imageUrl: firstImageByProperty.get(row.id) || null,
      }))
    )
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  return { properties, loading, error, reload: loadProperties }
}
