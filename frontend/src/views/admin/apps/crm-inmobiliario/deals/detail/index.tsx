import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
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

import ActivityFormModal from '../../components/ActivityFormModal'
import { ACTIVITY_STATUS_BADGE, ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from '../../components/activityLabels'

interface DealDetail {
  id: string
  value_estimate: number | null
  expected_close_date: string | null
  assigned_agent_id: string | null
  created_at: string
  contacts: { id: string; name: string; phone: string | null; email: string | null } | null
  properties: { id: string; title: string; price: number | null; currency: string; sector: string | null; city: string | null } | null
  pipeline_stages: { id: string; name: string } | null
}

interface ProfileRow {
  id: string
  full_name: string | null
  email: string
}

interface ActivityRow {
  id: string
  type: string
  status: string
  due_at: string | null
  notes: string | null
  created_at: string
}

interface StageHistoryRow {
  id: string
  changed_at: string
  changed_by: string | null
  from_stage: { name: string } | null
  to_stage: { name: string } | null
}

const formatCurrency = (value: number | null) => {
  if (value == null) return 'Sin definir'
  return `RD$ ${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 0 }).format(value)}`
}

const formatDate = (value: string | null) => {
  if (!value) return 'Sin definir'
  return new Date(value).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const Page = () => {
  const { id } = useParams<{ id: string }>()
  const { tenantId } = useAuth()

  const [deal, setDeal] = useState<DealDetail | null>(null)
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [history, setHistory] = useState<StageHistoryRow[]>([])
  const [profilesById, setProfilesById] = useState<Map<string, ProfileRow>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showNewActivity, setShowNewActivity] = useState(false)
  const loadedIdRef = useRef<string | null>(null)

  const loadDetail = useCallback(async () => {
    if (!tenantId || !id) return
    if (loadedIdRef.current !== id) setLoading(true)

    const { data: dealRow, error: dealError } = await supabase
      .from('deals')
      .select(
        'id, value_estimate, expected_close_date, assigned_agent_id, created_at, contacts ( id, name, phone, email ), properties ( id, title, price, currency, sector, city ), pipeline_stages ( id, name )'
      )
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle()

    if (dealError) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar la negociación:', dealError.message)
      setLoadError('No se pudo cargar la negociación. Intenta de nuevo.')
      setDeal(null)
      setLoading(false)
      loadedIdRef.current = id
      return
    }
    setLoadError(null)

    const typedDeal = dealRow as unknown as DealDetail | null
    setDeal(typedDeal)

    const [{ data: activityRows }, { data: historyRows }] = await Promise.all([
      supabase.from('activities').select('id, type, status, due_at, notes, created_at').eq('tenant_id', tenantId).eq('deal_id', id).order('created_at', { ascending: false }),
      supabase
        .from('deal_stage_history')
        .select('id, changed_at, changed_by, from_stage:pipeline_stages!from_stage_id ( name ), to_stage:pipeline_stages!to_stage_id ( name )')
        .eq('tenant_id', tenantId)
        .eq('deal_id', id)
        .order('changed_at', { ascending: false }),
    ])

    setActivities(activityRows || [])
    const typedHistory = (historyRows as unknown as StageHistoryRow[]) || []
    setHistory(typedHistory)

    const profileIds = Array.from(
      new Set([typedDeal?.assigned_agent_id, ...typedHistory.map((h) => h.changed_by)].filter((value): value is string => Boolean(value)))
    )

    if (profileIds.length) {
      const { data: profileRows } = await supabase.from('profiles').select('id, full_name, email').eq('tenant_id', tenantId).in('id', profileIds)
      setProfilesById(new Map((profileRows || []).map((row) => [row.id, row])))
    } else {
      setProfilesById(new Map())
    }

    setLoading(false)
    loadedIdRef.current = id
  }, [tenantId, id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

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
    if (!window.confirm('¿Eliminar esta actividad?')) return
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
        <PageBreadcrumb title="Negociación" subtitle="CRM Inmobiliario" />
        <div className="text-center py-5">
          <p className="text-danger mb-3">{loadError}</p>
          <Button variant="primary" onClick={loadDetail}>
            Reintentar
          </Button>
        </div>
      </>
    )
  }

  if (!deal) {
    return (
      <>
        <PageBreadcrumb title="Negociación" subtitle="CRM Inmobiliario" />
        <p className="text-muted text-center py-5">No se encontró la negociación.</p>
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title={deal.properties?.title || 'Negociación'} subtitle="Negociaciones" />

      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Datos de la negociación</h5>
              {deal.pipeline_stages && <Badge className="text-bg-primary">{deal.pipeline_stages.name}</Badge>}
            </CardHeader>
            <CardBody>
              <Row className="g-3">
                <Col md={6}>
                  <p className="text-muted fs-xs mb-1">Contacto</p>
                  {deal.contacts ? (
                    <Link to={`/crm/contactos/${deal.contacts.id}`} className="link-reset fw-medium">
                      {deal.contacts.name}
                    </Link>
                  ) : (
                    <span className="fw-medium">Sin contacto asociado</span>
                  )}
                  {deal.contacts?.phone && <p className="mb-0 text-muted fs-xs">{deal.contacts.phone}</p>}
                </Col>
                <Col md={6}>
                  <p className="text-muted fs-xs mb-1">Propiedad</p>
                  {deal.properties ? (
                    <Link to={`/crm/propiedades/${deal.properties.id}/editar`} className="link-reset fw-medium">
                      {deal.properties.title}
                    </Link>
                  ) : (
                    <span className="fw-medium">Sin propiedad asociada</span>
                  )}
                  {deal.properties?.sector && (
                    <p className="mb-0 text-muted fs-xs">
                      {deal.properties.sector}
                      {deal.properties.city ? `, ${deal.properties.city}` : ''}
                    </p>
                  )}
                </Col>
                <Col md={6}>
                  <p className="text-muted fs-xs mb-1">Valor estimado</p>
                  <p className="fw-medium mb-0">{formatCurrency(deal.value_estimate)}</p>
                </Col>
                <Col md={6}>
                  <p className="text-muted fs-xs mb-1">Fecha estimada de cierre</p>
                  <p className="fw-medium mb-0">{formatDate(deal.expected_close_date)}</p>
                </Col>
                <Col md={6}>
                  <p className="text-muted fs-xs mb-1">Agente asignado</p>
                  <p className="fw-medium mb-0">
                    {(deal.assigned_agent_id && (profilesById.get(deal.assigned_agent_id)?.full_name || profilesById.get(deal.assigned_agent_id)?.email)) ||
                      'Sin asignar'}
                  </p>
                </Col>
                <Col md={6}>
                  <p className="text-muted fs-xs mb-1">Creada el</p>
                  <p className="fw-medium mb-0">{formatDate(deal.created_at)}</p>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <CardHeader>
              <h5 className="mb-0">Acciones</h5>
            </CardHeader>
            <ListGroup variant="flush">
              <ListGroupItem action as={Link} to="/crm/negociaciones" className="d-flex align-items-center gap-2">
                <Icon icon="kanban" className="text-muted" />
                Volver al pipeline
              </ListGroupItem>
              {deal.contacts && (
                <ListGroupItem action as={Link} to={`/crm/contactos/${deal.contacts.id}`} className="d-flex align-items-center gap-2">
                  <Icon icon="user" className="text-muted" />
                  Ver contacto
                </ListGroupItem>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Actividades</h5>
              <Button size="sm" variant="primary" onClick={() => setShowNewActivity(true)}>
                <Icon icon="plus" className="fs-sm me-1" /> Nueva
              </Button>
            </CardHeader>
            <ListGroup variant="flush">
              {activities.length === 0 && <ListGroupItem className="text-muted">Sin actividades registradas.</ListGroupItem>}
              {activities.map((activity) => (
                <ListGroupItem key={activity.id} className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="mb-1 fw-medium">{ACTIVITY_TYPE_LABELS[activity.type] || activity.type}</p>
                    {activity.notes && <p className="mb-0 text-muted fs-xs">{activity.notes}</p>}
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <Dropdown align="end">
                      <DropdownToggle as="span" bsPrefix="badge-dropdown-toggle" style={{ cursor: 'pointer' }}>
                        <Badge className={ACTIVITY_STATUS_BADGE[activity.status] || 'text-bg-secondary'}>
                          {ACTIVITY_STATUS_LABELS[activity.status] || activity.status}
                        </Badge>
                      </DropdownToggle>
                      <DropdownMenu>
                        {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
                          <DropdownItem key={value} onClick={() => handleActivityStatusChange(activity.id, value)}>
                            {label}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                    <button type="button" className="btn btn-icon btn-sm btn-ghost-light text-muted" onClick={() => handleDeleteActivity(activity.id)}>
                      <Icon icon="trash-2" className="fs-sm" />
                    </button>
                  </div>
                </ListGroupItem>
              ))}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <CardHeader>
              <h5 className="mb-0">Historial de etapa</h5>
            </CardHeader>
            <ListGroup variant="flush">
              {history.length === 0 && <ListGroupItem className="text-muted">Sin cambios de etapa registrados.</ListGroupItem>}
              {history.map((entry) => {
                const changedByProfile = entry.changed_by ? profilesById.get(entry.changed_by) : undefined
                return (
                  <ListGroupItem key={entry.id}>
                    <p className="mb-1">
                      {entry.from_stage ? (
                        <>
                          <span className="text-muted">{entry.from_stage.name}</span> <Icon icon="arrow-right" className="text-muted fs-sm mx-1" />{' '}
                          <span className="fw-medium">{entry.to_stage?.name}</span>
                        </>
                      ) : (
                        <span className="fw-medium">Creada en {entry.to_stage?.name}</span>
                      )}
                    </p>
                    <p className="mb-0 text-muted fs-xs">
                      {formatDateTime(entry.changed_at)}
                      {changedByProfile && ` · ${changedByProfile.full_name || changedByProfile.email}`}
                    </p>
                  </ListGroupItem>
                )
              })}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <ActivityFormModal
        show={showNewActivity}
        onHide={() => setShowNewActivity(false)}
        onSaved={loadDetail}
        dealId={deal.id}
        contactId={deal.contacts?.id}
      />
    </>
  )
}

export default Page
