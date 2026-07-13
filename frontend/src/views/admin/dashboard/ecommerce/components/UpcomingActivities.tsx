import Icon from '@/components/wrappers/Icon'
import { ACTIVITY_STATUS_BADGE, ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from '@/views/admin/apps/crm-inmobiliario/components/activityLabels'
import { Badge, Card, CardBody, CardHeader, CardTitle, ListGroup, ListGroupItem } from 'react-bootstrap'

import type { UpcomingActivity } from './useDashboardStats'

const formatDueDate = (value: string | null) => {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const UpcomingActivities = ({ activities }: { activities: UpcomingActivity[] }) => {
  return (
    <Card className="h-100 mb-0">
      <CardHeader>
        <CardTitle as="h4">Próximas actividades pendientes</CardTitle>
      </CardHeader>
      {activities.length === 0 ? (
        <CardBody>
          <p className="text-muted text-center py-4 mb-0">No hay actividades pendientes.</p>
        </CardBody>
      ) : (
        <ListGroup variant="flush">
          {activities.map((activity) => (
            <ListGroupItem key={activity.id} className="d-flex justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <Icon icon="calendar-clock" className="text-muted fs-lg flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="mb-0 fw-medium text-truncate">
                    {ACTIVITY_TYPE_LABELS[activity.type] || activity.type}
                    {activity.contactName ? ` — ${activity.contactName}` : ''}
                  </p>
                  <p className="mb-0 text-muted fs-xs">{formatDueDate(activity.dueAt)}</p>
                </div>
              </div>
              <Badge className={`${ACTIVITY_STATUS_BADGE[activity.status]} flex-shrink-0`}>{ACTIVITY_STATUS_LABELS[activity.status] || activity.status}</Badge>
            </ListGroupItem>
          ))}
        </ListGroup>
      )}
    </Card>
  )
}

export default UpcomingActivities
