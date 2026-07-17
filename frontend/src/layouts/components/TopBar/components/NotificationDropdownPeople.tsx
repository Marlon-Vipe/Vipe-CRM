import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { formatRelativeTime } from '@/utils/helpers'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'

import { useNotifications, type NotificationItem, type NotificationType } from './useNotifications'

const TYPE_STYLE: Record<NotificationType, { icon: string; badgeBg: string }> = {
  new_message: { icon: 'message-circle', badgeBg: 'bg-info' },
  new_lead: { icon: 'user-plus', badgeBg: 'bg-success' },
  invitation_accepted: { icon: 'user-check', badgeBg: 'bg-primary' },
  activity_due: { icon: 'alarm-clock', badgeBg: 'bg-danger' },
}

const NotificationDropdown = () => {
  const { t, i18n } = useTranslation()
  const { notifications, unreadCount, markSeen } = useNotifications()

  const getBodyText = (notification: NotificationItem): string => {
    if (notification.type === 'invitation_accepted') {
      return t('notifications.types.invitation_accepted', { role: t(`common.roles.${notification.metadata.role}`, notification.metadata.role) })
    }
    if ((notification.type === 'new_message' || notification.type === 'activity_due') && notification.body) {
      return notification.body
    }
    return t(`notifications.types.${notification.type}`)
  }

  return (
    <div id="notification-dropdown-people" className="topbar-item">
      <Dropdown align="end" onToggle={(isOpen) => !isOpen && markSeen()}>
        <DropdownToggle className="topbar-link drop-arrow-none" as="button">
          <span className="topbar-link-icon">
            <Icon icon="bell" className="animate-ring" />
          </span>
          {unreadCount > 0 && <span className="badge text-bg-danger badge-circle topbar-badge">{unreadCount}</span>}
        </DropdownToggle>

        <DropdownMenu className="p-0 dropdown-menu-end dropdown-menu-lg">
          <div className="px-3 py-2 border-bottom">
            <Row className="align-items-center">
              <Col>
                <h6 className="m-0 fs-md fw-semibold">{t('notifications.title')}</h6>
              </Col>
              <Col className="text-end">
                <span className="badge badge-soft-success badge-label py-1">{t('notifications.count', { count: notifications.length })}</span>
              </Col>
            </Row>
          </div>

          <SimpleBar style={{ maxHeight: 300 }}>
            {notifications.length === 0 && <p className="text-muted text-center py-4 mb-0 fs-sm">{t('notifications.empty')}</p>}
            {notifications.map((notif) => {
              const style = TYPE_STYLE[notif.type]
              const content = (
                <span className="d-flex align-items-center gap-3">
                  <span className="flex-shrink-0 position-relative">
                    <span className={`avatar-md rounded-circle ${notif.unread ? style.badgeBg + '-subtle' : 'bg-light'} d-flex align-items-center justify-content-center`}>
                      <Icon icon={style.icon} className="fs-4" />
                    </span>
                    {notif.unread && (
                      <span className={`position-absolute rounded-pill ${style.badgeBg} notification-badge`}>
                        <Icon icon="bell" className="align-middle" />
                        <span className="visually-hidden">unread</span>
                      </span>
                    )}
                  </span>

                  <span className="flex-grow-1 text-muted">
                    <span className="fw-medium text-body">{notif.title}</span> {getBodyText(notif)}
                    <br />
                    <span className="fs-xs">{formatRelativeTime(notif.createdAt, i18n.language)}</span>
                  </span>
                </span>
              )

              return notif.link ? (
                <DropdownItem key={notif.id} as={Link} to={notif.link} className="notification-item py-2 text-wrap">
                  {content}
                </DropdownItem>
              ) : (
                <DropdownItem key={notif.id} className="notification-item py-2 text-wrap" disabled>
                  {content}
                </DropdownItem>
              )
            })}
          </SimpleBar>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default NotificationDropdown
