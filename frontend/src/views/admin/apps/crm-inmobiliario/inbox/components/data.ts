export type ConversationItem = {
  id: string
  contactId: string | null
  contactName: string
  channelType: 'whatsapp' | 'instagram' | 'messenger'
  lastMessage: string | null
  lastMessageAt: string | null
  status: 'abierta' | 'cerrada'
}

export type MessageItem = {
  id: string
  direction: 'entrante' | 'saliente'
  content: string | null
  type: string
  createdAt: string
}

export function getChannelLabels(t: (key: string) => string): Record<string, string> {
  return {
    whatsapp: t('crm.contacts.channels.whatsapp'),
    instagram: t('crm.contacts.channels.instagram'),
    messenger: t('crm.contacts.channels.messenger'),
  }
}
