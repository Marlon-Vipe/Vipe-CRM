import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { connectWhatsAppChannel, disconnectChannel, listChannels } from '@/lib/api'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Alert, Badge, Button, Card, CardBody, CardHeader, Form, FormControl, FormLabel, FormText, ListGroup, ListGroupItem, Spinner } from 'react-bootstrap'

import WhatsAppTemplatesCard from './WhatsAppTemplatesCard'

interface Channel {
  id: string
  type: string
  provider: string
  external_id: string
  status: string
}

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  activo: { label: 'Activo', variant: 'success' },
  conectando: { label: 'Conectando', variant: 'info' },
  desconectado: { label: 'Desconectado', variant: 'secondary' },
  error: { label: 'Error', variant: 'danger' },
}

const WhatsAppChannelTab = () => {
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
    if (!window.confirm('¿Desconectar este número de WhatsApp? Las conversaciones ya existentes se conservan.')) return
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

  return (
    <>
      <Card className="mb-3">
        <CardHeader>
        <h5 className="mb-0">Canal de WhatsApp</h5>
      </CardHeader>
      <CardBody>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        {channels.length > 0 ? (
          <ListGroup variant="flush" className="mb-3">
            {channels.map((channel) => (
              <ListGroupItem key={channel.id} className="d-flex justify-content-between align-items-center px-0">
                <div>
                  <p className="mb-0 fw-medium">{channel.external_id}</p>
                  <Badge bg={STATUS_LABELS[channel.status]?.variant || 'secondary'}>{STATUS_LABELS[channel.status]?.label || channel.status}</Badge>
                </div>
                {canManageChannels && channel.status !== 'desconectado' && (
                  <Button size="sm" variant="light" onClick={() => handleDisconnect(channel.id)}>
                    <Icon icon="unplug" className="fs-sm me-1" /> Desconectar
                  </Button>
                )}
              </ListGroupItem>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted">Todavía no has conectado ningún número de WhatsApp.</p>
        )}

        {canManageChannels && (
          <Form onSubmit={handleConnect} className="d-flex gap-2 align-items-end flex-wrap">
            <div>
              <FormLabel>Número de WhatsApp Business</FormLabel>
              <FormControl
                type="tel"
                placeholder="+18095551234"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <FormText>
                Usa el número ya aprovisionado en la consola de Twilio (o el número del sandbox de WhatsApp mientras desarrollas).
              </FormText>
            </div>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Conectando...' : 'Conectar número'}
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
