import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { createWhatsAppTemplate, deleteWhatsAppTemplate, listWhatsAppTemplates, type WhatsAppTemplate } from '@/lib/api'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Badge, Button, Card, CardBody, CardHeader, Form, FormControl, FormLabel, FormText, ListGroup, ListGroupItem } from 'react-bootstrap'

const WhatsAppTemplatesCard = () => {
  const { t } = useTranslation()
  const { session, role } = useAuth()
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [contentSid, setContentSid] = useState('')
  const [variableLabels, setVariableLabels] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const canManage = role === 'owner' || role === 'admin'

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      setTemplates(await listWhatsAppTemplates(session.access_token))
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) return
    setSubmitting(true)
    setErrorMessage('')
    try {
      await createWhatsAppTemplate({
        accessToken: session.access_token,
        name: name.trim(),
        twilioContentSid: contentSid.trim(),
        variableLabels: variableLabels
          .split(',')
          .map((label) => label.trim())
          .filter(Boolean),
      })
      setName('')
      setContentSid('')
      setVariableLabels('')
      await load()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!session) return
    if (!window.confirm(t('profileBilling.templates.deleteConfirm'))) return
    try {
      await deleteWhatsAppTemplate({ accessToken: session.access_token, templateId })
      await load()
    } catch (error) {
      setErrorMessage((error as Error).message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h5 className="mb-0">{t('profileBilling.templates.title')}</h5>
      </CardHeader>
      <CardBody>
        <p className="text-muted fs-sm">
          {t('profileBilling.templates.descriptionPart1')} <strong>Content SID</strong> {t('profileBilling.templates.descriptionPart2')}
        </p>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        {!loading && templates.length > 0 && (
          <ListGroup variant="flush" className="mb-3">
            {templates.map((template) => (
              <ListGroupItem key={template.id} className="d-flex justify-content-between align-items-center px-0">
                <div>
                  <p className="mb-0 fw-medium">{template.name}</p>
                  <p className="mb-0 text-muted fs-xs">{template.twilio_content_sid}</p>
                  {template.variable_labels.length > 0 && (
                    <div className="mt-1">
                      {template.variable_labels.map((label, index) => (
                        <Badge key={index} bg="light" text="dark" className="me-1">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {canManage && (
                  <button type="button" className="btn btn-icon btn-sm btn-ghost-light text-muted" onClick={() => handleDelete(template.id)}>
                    <Icon icon="trash-2" className="fs-sm" />
                  </button>
                )}
              </ListGroupItem>
            ))}
          </ListGroup>
        )}

        {!loading && templates.length === 0 && <p className="text-muted">{t('profileBilling.templates.noTemplates')}</p>}

        {canManage && (
          <Form onSubmit={handleCreate} className="d-flex gap-2 align-items-end flex-wrap border-top pt-3 mt-3">
            <div>
              <FormLabel>{t('profileBilling.templates.nameLabel')}</FormLabel>
              <FormControl
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profileBilling.templates.namePlaceholder')}
                required
              />
            </div>
            <div>
              <FormLabel>{t('profileBilling.templates.contentSidLabel')}</FormLabel>
              <FormControl value={contentSid} onChange={(e) => setContentSid(e.target.value)} placeholder="HX..." required />
            </div>
            <div>
              <FormLabel>{t('profileBilling.templates.variablesLabel')}</FormLabel>
              <FormControl
                value={variableLabels}
                onChange={(e) => setVariableLabels(e.target.value)}
                placeholder={t('profileBilling.templates.variablesPlaceholder')}
              />
              <FormText>
                {t('profileBilling.templates.variablesHint')} {'{{1}}'}, {'{{2}}'}.
              </FormText>
            </div>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? t('common.saving') : t('profileBilling.templates.addButton')}
            </Button>
          </Form>
        )}
      </CardBody>
    </Card>
  )
}

export default WhatsAppTemplatesCard
