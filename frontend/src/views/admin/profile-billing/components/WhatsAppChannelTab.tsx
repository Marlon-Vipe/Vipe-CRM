import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { connectWhatsAppChannel, disconnectChannel, listChannels } from '@/lib/api'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Badge, Button, Card, CardBody, CardHeader, Form, FormControl, FormLabel, FormText, ListGroup, ListGroupItem, Spinner } from 'react-bootstrap'

import WhatsAppTemplatesCard from './WhatsAppTemplatesCard'

interface Channel {
  id: string
  type: string
  provider: string
  external_id: string
  status: string
}

const STATUS_VARIANTS: Record<string, string> = {
  activo: 'success',
  conectando: 'info',
  desconectado: 'secondary',
  error: 'danger',
}

function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    activo: t('profileBilling.whatsapp.status.activo'),
    conectando: t('profileBilling.whatsapp.status.conectando'),
    desconectado: t('profileBilling.whatsapp.status.desconectado'),
    error: t('profileBilling.whatsapp.status.error'),
  }
}

const WhatsAppChannelTab = () => {
  const { t } = useTranslation()
  const { session, role } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const canManageChannels = role === 'owner' || role === 'admin'

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const data = await listChannels(session.access_token)
      setChannels(data.filter((channel) => channel.type === 'whatsapp'))
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  const handleConnect = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) return
    setSubmitting(true)
    setErrorMessage('')
    try {
      await connectWhatsAppChannel({ accessToken: session.access_token, phoneNumber: phoneNumber.trim() })
      setPhoneNumber('')
      await load()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisconnect = async (channelId: string) => {
    if (!session) return
    if (!window.confirm(t('profileBilling.whatsapp.disconnectConfirm'))) return
    try {
      await disconnectChannel({ accessToken: session.access_token, channelId })
      await load()
    } catch (error) {
      setErrorMessage((error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  const statusLabels = getStatusLabels(t)

  return (
    <>
      <Card className="mb-3">
        <CardHeader>
        <h5 className="mb-0">{t('profileBilling.whatsapp.title')}</h5>
      </CardHeader>
      <CardBody>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        {channels.length > 0 ? (
          <ListGroup variant="flush" className="mb-3">
            {channels.map((channel) => (
              <ListGroupItem key={channel.id} className="d-flex justify-content-between align-items-center px-0">
                <div>
                  <p className="mb-0 fw-medium">{channel.external_id}</p>
                  <Badge bg={STATUS_VARIANTS[channel.status] || 'secondary'}>{statusLabels[channel.status] || channel.status}</Badge>
                </div>
                {canManageChannels && channel.status !== 'desconectado' && (
                  <Button size="sm" variant="light" onClick={() => handleDisconnect(channel.id)}>
                    <Icon icon="unplug" className="fs-sm me-1" /> {t('profileBilling.whatsapp.disconnect')}
                  </Button>
                )}
              </ListGroupItem>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted">{t('profileBilling.whatsapp.noChannels')}</p>
        )}

        {canManageChannels && (
          <Form onSubmit={handleConnect} className="d-flex gap-2 align-items-end flex-wrap">
            <div>
              <FormLabel>{t('profileBilling.whatsapp.phoneNumberLabel')}</FormLabel>
              <FormControl
                type="tel"
                placeholder="+18095551234"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <FormText>{t('profileBilling.whatsapp.phoneNumberHint')}</FormText>
            </div>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? t('common.connecting') : t('profileBilling.whatsapp.connectButton')}
            </Button>
          </Form>
        )}
      </CardBody>
    </Card>

    <WhatsAppTemplatesCard />
    </>
  )
}

export default WhatsAppChannelTab
