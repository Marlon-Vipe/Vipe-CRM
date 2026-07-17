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
