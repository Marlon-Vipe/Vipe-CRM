/**
 * Cuando Supabase Auth exige confirmación de email, el signup no obtiene una
 * sesión inmediata y el backend no puede crear el tenant todavía (necesita el
 * access_token del usuario ya autenticado). Guardamos el nombre de la agencia
 * aquí para completar la creación del tenant en el primer sign-in exitoso.
 */

const STORAGE_KEY = "crm_pending_tenant_name";

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function setPendingTenantName(email, tenantName) {
  const map = readMap();
  map[email] = tenantName;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getPendingTenantName(email) {
  return readMap()[email] ?? null;
}

export function clearPendingTenantName(email) {
  const map = readMap();
  delete map[email];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
