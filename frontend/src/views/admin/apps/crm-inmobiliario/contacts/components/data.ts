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

export const CONTACT_TYPE_BADGE: Record<string, string> = {
  comprador: 'bg-success',
  vendedor: 'bg-primary',
  arrendatario: 'bg-info',
}

export function getContactTypeLabels(t: (key: string) => string): Record<string, string> {
  return {
    comprador: t('crm.contacts.types.comprador'),
    vendedor: t('crm.contacts.types.vendedor'),
    arrendatario: t('crm.contacts.types.arrendatario'),
  }
}

export function getContactSourceLabels(t: (key: string) => string): Record<string, string> {
  return {
    web: t('crm.contacts.sources.web'),
    referido: t('crm.contacts.sources.referido'),
    portal: t('crm.contacts.sources.portal'),
    whatsapp: t('crm.contacts.sources.whatsapp'),
    instagram: t('crm.contacts.sources.instagram'),
    facebook: t('crm.contacts.sources.facebook'),
    walk_in: t('crm.contacts.sources.walk_in'),
    otro: t('crm.contacts.sources.otro'),
  }
}
