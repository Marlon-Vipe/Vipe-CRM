import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  ListGroup,
  ListGroupItem,
  Row,
  Spinner,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { CONTACT_TYPE_BADGE, getContactSourceLabels, getContactTypeLabels } from '../components/data'
import ContactFormModal from '../components/ContactFormModal'
import ActivityFormModal from '../../components/ActivityFormModal'
import { ACTIVITY_STATUS_BADGE, getActivityStatusLabels, getActivityTypeLabels } from '../../components/activityLabels'

interface ContactDetail {
  id: string
  name: string
  phone: string | null
  email: string | null
  type: 'comprador' | 'vendedor' | 'arrendatario' | null
  source: string
  notes: string | null
  created_at: string
}

interface ActivityRow {
  id: string
  type: string
  status: string
  due_at: string | null
  notes: string | null
  created_at: string
}

interface ConversationRow {
  id: string
  status: string
  last_message_at: string | null
  channels: { type: string } | null
}

const Page = () => {
  const { t } = useTranslation()
  const contactTypeLabels = getContactTypeLabels(t)
  const contactSourceLabels = getContactSourceLabels(t)
  const activityTypeLabels = getActivityTypeLabels(t)
  const activityStatusLabels = getActivityStatusLabels(t)
  const channelTypeLabels: Record<string, string> = {
    whatsapp: t('crm.contacts.channels.whatsapp'),
    instagram: t('crm.contacts.channels.instagram'),
    messenger: t('crm.contacts.channels.messenger'),
  }
  const { id } = useParams<{ id: string }>()
  const { tenantId } = useAuth()
  const navigate = useNavigate()

  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showEditContact, setShowEditContact] = useState(false)
  const [showNewActivity, setShowNewActivity] = useState(false)
  // Recordar para qué id ya se cargó, para no volver a mostrar el spinner de
  // pantalla completa cuando un reload (ej. agregar una actividad) es sobre
  // el mismo contacto — solo cambiar de contacto amerita el spinner de nuevo.
  const loadedIdRef = useRef<string | null>(null)

  const loadDetail = useCallback(async () => {
    if (!tenantId || !id) return
    if (loadedIdRef.current !== id) setLoading(true)

    const [contactResult, activityResult, conversationResult] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, name, phone, email, type, source, notes, created_at')
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('activities')
        .select('id, type, status, due_at, notes, created_at')
        .eq('tenant_id', tenantId)
        .eq('contact_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('conversations')
        .select('id, status, last_message_at, channels ( type )')
        .eq('tenant_id', tenantId)
        .eq('contact_id', id)
        .order('last_message_at', { ascending: false }),
    ])

    if (contactResult.error) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar el contacto:', contactResult.error.message)
      setLoadError(t('crm.contacts.detail.loadError'))
      setContact(null)
      setLoading(false)
      loadedIdRef.current = id
      return
    }
    setLoadError(null)

    setContact(contactResult.data as ContactDetail | null)
    setActivities(activityResult.data || [])
    setConversations((conversationResult.data as unknown as ConversationRow[]) || [])
    setLoading(false)
    loadedIdRef.current = id
  }, [tenantId, id, t])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const handleDeleteContact = async () => {
    if (!tenantId || !contact) return
    if (!window.confirm(t('crm.contacts.deleteConfirm', { name: contact.name }))) return
    const { error } = await supabase.from('contacts').delete().eq('id', contact.id).eq('tenant_id', tenantId)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    navigate('/crm/contactos', { replace: true })
  }

  const handleActivityStatusChange = async (activityId: string, status: string) => {
    if (!tenantId) return
    const { error } = await supabase.from('activities').update({ status }).eq('id', activityId).eq('tenant_id', tenantId)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    loadDetail()
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!tenantId) return
    if (!window.confirm(t('crm.contacts.detail.deleteActivityConfirm'))) return
    const { error } = await supabase.from('activities').delete().eq('id', activityId).eq('tenant_id', tenantId)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    loadDetail()
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (loadError) {
    return (
      <>
        <PageBreadcrumb title={t('crm.contacts.detail.title')} subtitle={t('nav.crmGroup')} />
        <div className="text-center py-5">
          <p className="text-danger mb-3">{loadError}</p>
          <Button variant="primary" onClick={loadDetail}>
            {t('common.retry')}
          </Button>
        </div>
      </>
    )
  }

  if (!contact) {
    return (
      <>
        <PageBreadcrumb title={t('crm.contacts.detail.title')} subtitle={t('nav.crmGroup')} />
        <p className="text-muted text-center py-5">{t('crm.contacts.detail.notFound')}</p>
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title={contact.name} subtitle={t('nav.contacts')} />

      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Row>
        <Col lg={4}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('crm.contacts.detail.contactData')}</h5>
              <div className="d-flex align-items-center gap-2">
                {contact.type && <Badge className={CONTACT_TYPE_BADGE[contact.type]}>{contactTypeLabels[contact.type]}</Badge>}
                <Dropdown align="end">
                  <DropdownToggle className="btn btn-icon btn-sm drop-arrow-none btn-ghost-light text-muted content-none" type="button">
                    <Icon icon="ellipsis-vertical" className="fs-lg" />
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem onClick={() => setShowEditContact(true)}>
                      <Icon icon="square-pen" className="me-2" /> {t('common.edit')}
                    </DropdownItem>
                    <DropdownItem className="text-danger" onClick={handleDeleteContact}>
                      <Icon icon="trash-2" className="me-2" /> {t('common.delete')}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </CardHeader>
            <CardBody>
              <p className="mb-2">
                <Icon icon="mail" className="me-2 text-muted" />
                {contact.email || t('crm.contacts.detail.noEmail')}
              </p>
              <p className="mb-2">
                <Icon icon="phone" className="me-2 text-muted" />
                {contact.phone || t('crm.contacts.detail.noPhone')}
              </p>
              <p className="mb-2">
                <Icon icon="radio-tower" className="me-2 text-muted" />
                {t('crm.contacts.sourcePrefix')} {contactSourceLabels[contact.source] || contact.source}
              </p>
              {contact.notes && <p className="mb-0 text-muted">{contact.notes}</p>}
            </CardBody>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('crm.contacts.detail.activities')}</h5>
              <Button size="sm" variant="primary" onClick={() => setShowNewActivity(true)}>
                <Icon icon="plus" className="fs-sm me-1" /> {t('crm.contacts.detail.newActivity')}
              </Button>
            </CardHeader>
            <ListGroup variant="flush">
              {activities.length === 0 && <ListGroupItem className="text-muted">{t('crm.contacts.detail.noActivities')}</ListGroupItem>}
              {activities.map((activity) => (
                <ListGroupItem key={activity.id} className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="mb-1 fw-medium">{activityTypeLabels[activity.type] || activity.type}</p>
                    {activity.notes && <p className="mb-0 text-muted fs-xs">{activity.notes}</p>}
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <Dropdown align="end">
                      <DropdownToggle as="span" bsPrefix="badge-dropdown-toggle" style={{ cursor: 'pointer' }}>
                        <Badge className={ACTIVITY_STATUS_BADGE[activity.status] || 'text-bg-secondary'}>
                          {activityStatusLabels[activity.status] || activity.status}
                        </Badge>
                      </DropdownToggle>
                      <DropdownMenu>
                        {Object.entries(activityStatusLabels).map(([value, label]) => (
                          <DropdownItem key={value} onClick={() => handleActivityStatusChange(activity.id, value)}>
                            {label}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm btn-ghost-light text-muted"
                      onClick={() => handleDeleteActivity(activity.id)}
                    >
                      <Icon icon="trash-2" className="fs-sm" />
                    </button>
                  </div>
                </ListGroupItem>
              ))}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <CardHeader>
              <h5 className="mb-0">{t('crm.contacts.detail.conversations')}</h5>
            </CardHeader>
            <ListGroup variant="flush">
              {conversations.length === 0 && <ListGroupItem className="text-muted">{t('crm.contacts.detail.noConversations')}</ListGroupItem>}
              {conversations.map((conversation) => (
                <ListGroupItem key={conversation.id} className="d-flex justify-content-between align-items-center">
                  <span>{(conversation.channels && channelTypeLabels[conversation.channels.type]) || t('crm.contacts.detail.channel')}</span>
                  <Link to="/crm/mensajes" className="link-reset fs-xs text-muted">
                    {t('crm.contacts.detail.viewInInbox')}
                  </Link>
                </ListGroupItem>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <ContactFormModal show={showEditContact} onHide={() => setShowEditContact(false)} onSaved={loadDetail} contact={contact} />
      <ActivityFormModal show={showNewActivity} onHide={() => setShowNewActivity(false)} onSaved={loadDetail} contactId={contact.id} />
    </>
  )
}

export default Page
