/**
 * Igual que pendingTenant.ts pero para el flujo de "aceptar invitación"
 * (RF-02): si Supabase Auth exige confirmar el email, el token de invitación
 * se guarda aquí para aceptarla en el primer sign-in exitoso.
 */

const STORAGE_KEY = 'crm_pending_invitation_token'

function readMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function setPendingInvitationToken(email: string, token: string): void {
  const map = readMap()
  map[email] = token
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getPendingInvitationToken(email: string): string | null {
  return readMap()[email] ?? null
}

export function clearPendingInvitationToken(email: string): void {
  const map = readMap()
  delete map[email]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}
