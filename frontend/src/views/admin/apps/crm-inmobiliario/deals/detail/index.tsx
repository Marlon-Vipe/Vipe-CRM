import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Badge, Card, CardBody, CardHeader, Col, ListGroup, ListGroupItem, Row, Spinner } from 'react-bootstrap'

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

interface AgentProfile {
  full_name: string | null
  email: string
}

const formatCurrency = (value: number | null) => {
  if (value == null) return 'Sin definir'
  return `RD$ ${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 0 }).format(value)}`
}

const formatDate = (value: string | null) => {
  if (!value) return 'Sin definir'
  return new Date(value).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const Page = () => {
  const { id } = useParams<{ id: string }>()
  const { tenantId } = useAuth()

  const [deal, setDeal] = useState<DealDetail | null>(null)
  const [agent, setAgent] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDetail = useCallback(async () => {
    if (!tenantId || !id) return
    setLoading(true)

    const { data: dealRow } = await supabase
      .from('deals')
      .select(
        'id, value_estimate, expected_close_date, assigned_agent_id, created_at, contacts ( id, name, phone, email ), properties ( id, title, price, currency, sector, city ), pipeline_stages ( id, name )'
      )
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle()

    const typedDeal = dealRow as unknown as DealDetail | null
    setDeal(typedDeal)

    if (typedDeal?.assigned_agent_id) {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('tenant_id', tenantId)
        .eq('id', typedDeal.assigned_agent_id)
        .maybeSingle()
      setAgent(profileRow)
    } else {
      setAgent(null)
    }

    setLoading(false)
  }, [tenantId, id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
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
                  <p className="fw-medium mb-0">{agent?.full_name || agent?.email || 'Sin asignar'}</p>
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
    </>
  )
}

export default Page
