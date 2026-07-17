// Supabase Auth siempre devuelve sus mensajes de error en inglés
// (AuthError.message). Acá se mapean los casos más comunes a una clave de
// traducción bajo auth.errors.* — así el mensaje se re-renderiza en el
// idioma activo en vez de quedar congelado en el idioma que estaba
// seleccionado cuando ocurrió el error. Si no hay traducción conocida, se
// muestra el mensaje original de Supabase en vez de esconder la causa real.
const KNOWN_MESSAGE_KEYS: Record<string, string> = {
  'Invalid login credentials': 'invalidCredentials',
  'Email not confirmed': 'emailNotConfirmed',
  'User already registered': 'userAlreadyRegistered',
  'Password should be at least 6 characters': 'passwordTooShort',
  'Unable to validate email address: invalid format': 'invalidEmailFormat',
  'Email rate limit exceeded': 'rateLimitExceeded',
  'signups not allowed for this instance': 'signupsDisabled',
}

export function translateAuthError(t: (key: string) => string, message: string): string {
  const key = KNOWN_MESSAGE_KEYS[message]
  if (key) return t(`auth.errors.${key}`)
  if (message.startsWith('For security purposes')) {
    return t('auth.errors.securityWait')
  }
  return message
}
