export type ContactType = {
  id: string
  name: string
  phone: string | null
  email: string | null
  type: 'comprador' | 'vendedor' | 'arrendatario' | null
  source: string
  created_at: string
  dealsCount: number
  pendingActivitiesCount: number
}

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  comprador: 'Comprador',
  vendedor: 'Vendedor',
  arrendatario: 'Arrendatario',
}

export const CONTACT_TYPE_BADGE: Record<string, string> = {
  comprador: 'bg-success',
  vendedor: 'bg-primary',
  arrendatario: 'bg-info',
}

export const CONTACT_SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  referido: 'Referido',
  portal: 'Portal inmobiliario',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  walk_in: 'Visita directa',
  otro: 'Otro',
}
