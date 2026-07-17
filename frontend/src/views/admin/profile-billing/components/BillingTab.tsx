import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { createCheckoutSession, createPortalSession, getSubscription } from '@/lib/api'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Badge, Button, Card, CardBody, CardHeader, Spinner } from 'react-bootstrap'

function getPlanLabels(t: (key: string) => string): Record<string, string> {
  return {
    starter: t('profileBilling.billing.plans.starter'),
    pro: t('profileBilling.billing.plans.pro'),
    agencia: t('profileBilling.billing.plans.agencia'),
  }
}

const STATUS_VARIANTS: Record<string, string> = {
  trial: 'info',
  activa: 'success',
  vencida: 'danger',
  cancelada: 'secondary',
}

function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    trial: t('profileBilling.billing.status.trial'),
    activa: t('profileBilling.billing.status.activa'),
    vencida: t('profileBilling.billing.status.vencida'),
    cancelada: t('profileBilling.billing.status.cancelada'),
  }
}

interface Subscription {
  plan: string
  status: string | null
  tenantStatus: string
  renewsAt: string | null
  billingConfigured: boolean
}

const BillingTab = () => {
  const { t, i18n } = useTranslation()
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

  const planLabels = getPlanLabels(t)
  const statusLabels = getStatusLabels(t)
  const statusInfo =
    subscription?.status && statusLabels[subscription.status]
      ? { label: statusLabels[subscription.status], variant: STATUS_VARIANTS[subscription.status] }
      : null

  return (
    <Card>
      <CardHeader>
        <h5 className="mb-0">{t('profileBilling.billing.title')}</h5>
      </CardHeader>
      <CardBody>
        {actionError && <Alert variant="danger">{actionError}</Alert>}

        {subscription && !subscription.billingConfigured && <Alert variant="warning">{t('profileBilling.billing.notConfigured')}</Alert>}

        <div className="d-flex align-items-center gap-2 mb-3">
          <div>
            <p className="mb-0 text-muted fs-xs">{t('profileBilling.billing.currentPlanLabel')}</p>
            <h4 className="mb-0">{planLabels[subscription?.plan || 'starter'] || subscription?.plan}</h4>
          </div>
          {statusInfo && (
            <Badge bg={statusInfo.variant} className="ms-2">
              {statusInfo.label}
            </Badge>
          )}
        </div>

        {subscription?.renewsAt && (
          <p className="text-muted fs-sm">
            {t('profileBilling.billing.renewsOn', {
              date: new Date(subscription.renewsAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-DO'),
            })}
          </p>
        )}

        {subscription?.tenantStatus === 'suspendido' && <Alert variant="danger">{t('profileBilling.billing.suspendedWarning')}</Alert>}

        {canManageBilling ? (
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button variant="primary" disabled={actionLoading !== null} onClick={() => handleCheckout('starter')}>
              {actionLoading === 'checkout-starter'
                ? t('profileBilling.billing.redirecting')
                : t('profileBilling.billing.subscribeButton', { plan: planLabels.starter })}
            </Button>
            <Button variant="outline-primary" disabled={actionLoading !== null} onClick={() => handleCheckout('pro')}>
              {actionLoading === 'checkout-pro'
                ? t('profileBilling.billing.redirecting')
                : t('profileBilling.billing.subscribeButton', { plan: planLabels.pro })}
            </Button>
            <Button variant="light" disabled={actionLoading !== null} onClick={handlePortal}>
              <Icon icon="credit-card" className="me-1" />
              {actionLoading === 'portal' ? t('profileBilling.billing.redirecting') : t('profileBilling.billing.managePayment')}
            </Button>
          </div>
        ) : (
          <p className="text-muted fs-sm mt-3">{t('profileBilling.billing.ownerOnly')}</p>
        )}
      </CardBody>
    </Card>
  )
}

export default BillingTab
