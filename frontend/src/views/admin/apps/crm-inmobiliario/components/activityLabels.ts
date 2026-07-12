export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  llamada: 'Llamada',
  visita: 'Visita',
  email: 'Email',
  whatsapp: 'WhatsApp',
  tarea_general: 'Tarea general',
}

export const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

export const ACTIVITY_STATUS_BADGE: Record<string, string> = {
  pendiente: 'text-bg-warning',
  completada: 'text-bg-success',
  cancelada: 'text-bg-secondary',
}
