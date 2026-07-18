export type PropertyStatus = 'disponible' | 'reservada' | 'vendida' | 'alquilada'
export type PropertyKind = 'venta' | 'alquiler'

export type PropertyType = {
  id: string
  title: string
  imageUrl: string | null
  price: number | null
  currency: string
  type: PropertyKind
  status: PropertyStatus
  sector: string | null
  city: string | null
  bedrooms: number | null
  bathrooms: number | null
  areaM2: number | null
}

export const STATUS_VARIANT: Record<PropertyStatus, string> = {
  disponible: 'success',
  reservada: 'warning',
  vendida: 'secondary',
  alquilada: 'info',
}

// Funciones (no objetos estáticos) para que los labels se resuelvan con
// `t()` en el idioma actual — un objeto a nivel de módulo se evaluaría una
// sola vez al importar el archivo y nunca reaccionaría a un cambio de idioma.
export function getStatusLabels(t: (key: string) => string): Record<PropertyStatus, string> {
  return {
    disponible: t('crm.properties.status.disponible'),
    reservada: t('crm.properties.status.reservada'),
    vendida: t('crm.properties.status.vendida'),
    alquilada: t('crm.properties.status.alquilada'),
  }
}

export function getTypeLabels(t: (key: string) => string): Record<PropertyKind, string> {
  return {
    venta: t('crm.properties.types.venta'),
    alquiler: t('crm.properties.types.alquiler'),
  }
}

export type PropertyCurrency = 'DOP' | 'USD'

export interface PropertyFiltersState {
  search: string
  types: Set<PropertyKind>
  statuses: Set<PropertyStatus>
  sectors: Set<string>
  priceCurrency: PropertyCurrency
  priceRange: [number, number]
}

// Cada propiedad tiene su propia moneda (DOP o USD) — mezclar montos de
// ambas en un solo rango numérico no tiene sentido sin una tasa de cambio.
// El filtro de precio solo aplica a las propiedades cuya moneda coincide con
// `priceCurrency`; las de la otra moneda no se excluyen por precio (siguen
// pasando el resto de los filtros normalmente).
export function getPriceBounds(properties: PropertyType[], currency: PropertyCurrency): [number, number] {
  const prices = properties.filter((p) => p.currency === currency && p.price != null).map((p) => p.price as number)
  if (prices.length === 0) return [0, 0]
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? [0, max || 1000] : [min, max]
}

export function createDefaultFilters(properties: PropertyType[], currency: PropertyCurrency = 'DOP'): PropertyFiltersState {
  return {
    search: '',
    types: new Set(),
    statuses: new Set(),
    sectors: new Set(),
    priceCurrency: currency,
    priceRange: getPriceBounds(properties, currency),
  }
}

export function filterProperties(properties: PropertyType[], filters: PropertyFiltersState): PropertyType[] {
  const query = filters.search.trim().toLowerCase()

  return properties.filter((property) => {
    if (filters.types.size > 0 && !filters.types.has(property.type)) return false
    if (filters.statuses.size > 0 && !filters.statuses.has(property.status)) return false
    if (filters.sectors.size > 0 && (!property.sector || !filters.sectors.has(property.sector))) return false

    if (query) {
      const haystack = `${property.title} ${property.sector ?? ''} ${property.city ?? ''}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (property.currency === filters.priceCurrency && property.price != null) {
      if (property.price < filters.priceRange[0] || property.price > filters.priceRange[1]) return false
    }

    return true
  })
}
