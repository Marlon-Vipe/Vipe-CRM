export const ACTIVITY_STATUS_BADGE: Record<string, string> = {
  pendiente: 'text-bg-warning',
  completada: 'text-bg-success',
  cancelada: 'text-bg-secondary',
}

export function getActivityTypeLabels(t: (key: string) => string): Record<string, string> {
  return {
    llamada: t('activity.types.llamada'),
    visita: t('activity.types.visita'),
    email: t('activity.types.email'),
    whatsapp: t('activity.types.whatsapp'),
    tarea_general: t('activity.types.tarea_general'),
  }
}

export function getActivityStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    pendiente: t('activity.status.pendiente'),
    completada: t('activity.status.completada'),
    cancelada: t('activity.status.cancelada'),
  }
}
