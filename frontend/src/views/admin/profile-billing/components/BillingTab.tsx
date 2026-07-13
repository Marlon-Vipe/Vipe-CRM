import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { createCheckoutSession, createPortalSession, getSubscription } from '@/lib/api'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, CardHeader, Spinner } from 'react-bootstrap'

const PLAN_LABELS: Record<string, string> = { starter: 'Starter', pro: 'Pro', agencia: 'Agencia' }
const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  trial: { label: 'En prueba', variant: 'info' },
  activa: { label: 'Activa', variant: 'success' },
  vencida: { label: 'Vencida', variant: 'danger' },
  cancelada: { label: 'Cancelada', variant: 'secondary' },
}

interface Subscription {
  plan: string
  status: string | null
  tenantStatus: string
  renewsAt: string | null
  billingConfigured: boolean
}

const BillingTab = () => {
  const { session, role } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const canManageBilling = role === 'owner'

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const data = await getSubscription(session.access_token)
      setSubscription(data)
    } catch (error) {
      setActionError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  const handleCheckout = async (plan: string) => {
    if (!session) return
    setActionError('')
    setActionLoading(`checkout-${plan}`)
    try {
      const { url } = await createCheckoutSession({ accessToken: session.access_token, plan })
      window.location.href = url
    } catch (error) {
      setActionError((error as Error).message)
      setActionLoading(null)
    }
  }

  const handlePortal = async () => {
    if (!session) return
    setActionError('')
    setActionLoading('portal')
    try {
      const { url } = await createPortalSession(session.access_token)
      window.location.href = url
    } catch (error) {
      setActionError((error as Error).message)
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  const statusInfo = subscription?.status ? STATUS_LABELS[subscription.status] : null

  return (
    <Card>
      <CardHeader>
        <h5 className="mb-0">Plan y facturación</h5>
      </CardHeader>
      <CardBody>
        {actionError && <Alert variant="danger">{actionError}</Alert>}

        {subscription && !subscription.billingConfigured && (
          <Alert variant="warning">
            La facturación todavía no está conectada a un proveedor de pagos. Puedes seguir usando el CRM con normalidad — esto solo
            afecta la posibilidad de actualizar el plan o gestionar el método de pago desde aquí.
          </Alert>
        )}

        <div className="d-flex align-items-center gap-2 mb-3">
          <div>
            <p className="mb-0 text-muted fs-xs">Plan actual</p>
            <h4 className="mb-0">{PLAN_LABELS[subscription?.plan || 'starter'] || subscription?.plan}</h4>
          </div>
          {statusInfo && (
            <Badge bg={statusInfo.variant} className="ms-2">
              {statusInfo.label}
            </Badge>
          )}
        </div>

        {subscription?.renewsAt && (
          <p className="text-muted fs-sm">Se renueva el {new Date(subscription.renewsAt).toLocaleDateString('es-DO')}.</p>
        )}

        {subscription?.tenantStatus === 'suspendido' && (
          <Alert variant="danger">
            La suscripción de tu agencia está vencida. No se pueden crear nuevos contactos, propiedades ni negociaciones hasta ponerse
            al día con el pago.
          </Alert>
        )}

        {canManageBilling ? (
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button variant="primary" disabled={actionLoading !== null} onClick={() => handleCheckout('starter')}>
              {actionLoading === 'checkout-starter' ? 'Redirigiendo...' : 'Suscribirme a Starter'}
            </Button>
            <Button variant="outline-primary" disabled={actionLoading !== null} onClick={() => handleCheckout('pro')}>
              {actionLoading === 'checkout-pro' ? 'Redirigiendo...' : 'Suscribirme a Pro'}
            </Button>
            <Button variant="light" disabled={actionLoading !== null} onClick={handlePortal}>
              <Icon icon="credit-card" className="me-1" />
              {actionLoading === 'portal' ? 'Redirigiendo...' : 'Gestionar método de pago'}
            </Button>
          </div>
        ) : (
          <p className="text-muted fs-sm mt-3">Solo el dueño de la agencia puede gestionar la facturación.</p>
        )}
      </CardBody>
    </Card>
  )
}

export default BillingTab
