import Icon from '@/components/wrappers/Icon'
import { ACTIVITY_STATUS_BADGE, getActivityStatusLabels, getActivityTypeLabels } from '@/views/admin/apps/crm-inmobiliario/components/activityLabels'
import { Badge, Card, CardBody, CardHeader, CardTitle, ListGroup, ListGroupItem } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import type { UpcomingActivity } from './useDashboardStats'

const UpcomingActivities = ({ activities }: { activities: UpcomingActivity[] }) => {
  const { t, i18n } = useTranslation()
  const activityTypeLabels = getActivityTypeLabels(t)
  const activityStatusLabels = getActivityStatusLabels(t)

  const formatDueDate = (value: string | null) => {
    if (!value) return t('crm.dashboard.noDate')
    return new Date(value).toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="h-100 mb-0">
      <CardHeader>
        <CardTitle as="h4">{t('crm.dashboard.upcomingActivities')}</CardTitle>
      </CardHeader>
      {activities.length === 0 ? (
        <CardBody>
          <p className="text-muted text-center py-4 mb-0">{t('crm.dashboard.noPendingActivities')}</p>
        </CardBody>
      ) : (
        <ListGroup variant="flush">
          {activities.map((activity) => (
            <ListGroupItem key={activity.id} className="d-flex justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <Icon icon="calendar-clock" className="text-muted fs-lg flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="mb-0 fw-medium text-truncate">
                    {activityTypeLabels[activity.type] || activity.type}
                    {activity.contactName ? ` — ${activity.contactName}` : ''}
                  </p>
                  <p className="mb-0 text-muted fs-xs">{formatDueDate(activity.dueAt)}</p>
                </div>
              </div>
              <Badge className={`${ACTIVITY_STATUS_BADGE[activity.status]} flex-shrink-0`}>{activityStatusLabels[activity.status] || activity.status}</Badge>
            </ListGroupItem>
          ))}
        </ListGroup>
      )}
    </Card>
  )
}

export default UpcomingActivities
