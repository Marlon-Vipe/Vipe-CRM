export type MembershipRole = 'owner' | 'admin' | 'agent'

export interface TeamMember {
  userId: string
  fullName: string | null
  email: string
  role: MembershipRole
}

export interface PendingInvitation {
  id: string
  email: string
  role: MembershipRole
  token: string
  expiresAt: string
}

export const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  agent: 'Agente',
}
