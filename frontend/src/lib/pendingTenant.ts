/**
 * Cuando Supabase Auth exige confirmación de email, el signup no obtiene una
 * sesión inmediata y no se puede crear el tenant todavía (hace falta el
 * access_token del usuario ya autenticado). Guardamos el nombre de la agencia
 * aquí para completar la creación del tenant en el primer sign-in exitoso.
 */

const STORAGE_KEY = 'crm_pending_tenant_name'

function readMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function setPendingTenantName(email: string, tenantName: string): void {
  const map = readMap()
  map[email] = tenantName
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getPendingTenantName(email: string): string | null {
  return readMap()[email] ?? null
}

export function clearPendingTenantName(email: string): void {
  const map = readMap()
  delete map[email]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}
