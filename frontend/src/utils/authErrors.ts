// Supabase Auth siempre devuelve sus mensajes de error en inglés
// (AuthError.message) — el resto de la interfaz está en español (ver
// CRM_PROMPT.md sección 9.3), así que se traducen los casos más comunes acá.
// Si no hay traducción conocida, se muestra el mensaje original de Supabase
// en vez de esconder la causa real del error.
const KNOWN_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  'User already registered': 'Ya existe una cuenta con este correo.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'El formato del correo electrónico no es válido.',
  'Email rate limit exceeded': 'Se enviaron demasiados correos. Espera unos minutos antes de intentar de nuevo.',
  'signups not allowed for this instance': 'El registro de nuevas cuentas no está habilitado.',
}

export function translateAuthError(message: string): string {
  if (KNOWN_MESSAGES[message]) return KNOWN_MESSAGES[message]
  if (message.startsWith('For security purposes')) {
    return 'Por seguridad, espera unos segundos antes de intentar de nuevo.'
  }
  return message
}
