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

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  disponible: 'Disponible',
  reservada: 'Reservada',
  vendida: 'Vendida',
  alquilada: 'Alquilada',
}

export const TYPE_LABEL: Record<PropertyKind, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
}
