export type StateType = {
  icon: string
  className: string
  prefix?: string
  value: number
  suffix?: string
  title: string
}

export function buildStateData({
  newLeadsCount,
  activePropertiesCount,
  openDealsCount,
  pendingActivitiesCount,
}: {
  newLeadsCount: number
  activePropertiesCount: number
  openDealsCount: number
  pendingActivitiesCount: number
}): StateType[] {
  return [
    {
      icon: 'tabler:user-plus',
      className: 'bg-primary-subtle text-primary',
      value: newLeadsCount,
      title: 'Leads nuevos (últimos 7 días)',
    },
    {
      icon: 'tabler:building',
      className: 'bg-success-subtle text-success',
      value: activePropertiesCount,
      title: 'Propiedades activas',
    },
    {
      icon: 'tabler:layout-kanban',
      className: 'bg-info-subtle text-info',
      value: openDealsCount,
      title: 'Negociaciones activas',
    },
    {
      icon: 'tabler:checklist',
      className: 'bg-warning-subtle text-warning',
      value: pendingActivitiesCount,
      title: 'Actividades pendientes',
    },
  ]
}
