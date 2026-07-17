export type StateType = {
  icon: string
  className: string
  prefix?: string
  value: number
  suffix?: string
  title: string
}

export function buildStateData(
  t: (key: string) => string,
  {
    newLeadsCount,
    activePropertiesCount,
    openDealsCount,
    pendingActivitiesCount,
  }: {
    newLeadsCount: number
    activePropertiesCount: number
    openDealsCount: number
    pendingActivitiesCount: number
  }
): StateType[] {
  return [
    {
      icon: 'tabler:user-plus',
      className: 'bg-primary-subtle text-primary',
      value: newLeadsCount,
      title: t('crm.dashboard.newLeads'),
    },
    {
      icon: 'tabler:building',
      className: 'bg-success-subtle text-success',
      value: activePropertiesCount,
      title: t('crm.dashboard.activeProperties'),
    },
    {
      icon: 'tabler:layout-kanban',
      className: 'bg-info-subtle text-info',
      value: openDealsCount,
      title: t('crm.dashboard.openDeals'),
    },
    {
      icon: 'tabler:checklist',
      className: 'bg-warning-subtle text-warning',
      value: pendingActivitiesCount,
      title: t('crm.dashboard.pendingActivities'),
    },
  ]
}
