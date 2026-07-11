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

export const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
}
