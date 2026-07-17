// Normaliza un teléfono a formato E.164 (ej. "+18095551234"). El webhook de
// WhatsApp (backend/src/routes/webhooksWhatsapp.js) hace match exacto contra
// el número que manda Twilio, que siempre viene en E.164 — si un contacto se
// crea manualmente con el teléfono en otro formato ("809-555-1234"), el
// match falla y se crea un contacto duplicado cuando esa persona escribe por
// WhatsApp. Se asume código de país +1 (República Dominicana) cuando el
// número tiene 10 dígitos y no trae "+".
export const normalizePhoneE164 = (input: string, defaultCountryCode = '1'): string | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  if (hasPlus) return `+${digits}`
  if (digits.length === 10) return `+${defaultCountryCode}${digits}`
  return `+${digits}`
}

// Intl.RelativeTimeFormat ya sabe pluralizar/formatear "hace 5 minutos" /
// "5 minutes ago" para 'es'/'en' sin necesidad de claves de traducción a mano.
export const formatRelativeTime = (iso: string, locale: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffSec = Math.round(diffMs / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffSec < 60) return rtf.format(-diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return rtf.format(-diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return rtf.format(-diffHour, 'hour')
  const diffDay = Math.round(diffHour / 24)
  return rtf.format(-diffDay, 'day')
}

export const generateInitials = (name = ''): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export const toPascalCase = (value: string) =>
  value
    .replace(/[-_ ]+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

export const toTitleCase = (value?: string) => {
  if (!value) return ''
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const formatBytes = (bytes: number, decimals: number = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function getColor(v: string, a: number = 1): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return ''
  }
  const val = getComputedStyle(document.documentElement).getPropertyValue(`--theme-${v}`).trim()
  return v.includes('-rgb') ? `rgba(${val}, ${a})` : val
}

export const getFont = () => {
  if (typeof window === 'undefined') {
    return
  }
  return getComputedStyle(document.body).fontFamily.trim()
}

export const generateRandomEChartData = (dataName: string[]) => {
  const randomData = dataName.map((name) => ({
    name: name,
    value: Math.floor(Math.random() * 100) + 1,
  }))
  const total = randomData.reduce((sum, item) => sum + item.value, 0)
  randomData.forEach((item) => {
    item.value = (item.value / total) * 100
  })
  return randomData
}

export const abbreviatedNumber = (val: number) => {
  const s = ['', 'k', 'm', 'b', 't']
  if (val === 0) return 0
  const sNum = Math.floor(Math.log10(val) / 3)
  let sVal = parseFloat((sNum != 0 ? val / Math.pow(1000, sNum) : val).toPrecision(2))
  if (sVal % 1 != 0) {
    sVal = Number.parseInt(sVal.toFixed(1))
  }
  return sVal + s[sNum]
}
