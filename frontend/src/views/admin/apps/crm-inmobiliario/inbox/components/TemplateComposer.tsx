import type { WhatsAppTemplate } from '@/lib/api'
import { useState, type FormEvent } from 'react'
import { Alert, Button, Col, Form, FormControl, FormLabel, FormSelect, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface Props {
  templates: WhatsAppTemplate[]
  templatesLoading: boolean
  sending: boolean
  disabled: boolean
  onSend: (templateId: string, variables: string[]) => Promise<void>
}

const TemplateComposer = ({ templates, templatesLoading, sending, disabled, onSend }: Props) => {
  const { t } = useTranslation()
  const [templateId, setTemplateId] = useState('')
  const [variables, setVariables] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  const selectedTemplate = templates.find((t) => t.id === templateId) || null

  const handleTemplateChange = (id: string) => {
    setTemplateId(id)
    const template = templates.find((t) => t.id === id)
    setVariables(template ? template.variable_labels.map(() => '') : [])
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedTemplate) return
    setErrorMessage('')
    try {
      await onSend(selectedTemplate.id, variables)
      setTemplateId('')
      setVariables([])
    } catch (error) {
      setErrorMessage((error as Error).message)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Alert variant="warning" className="py-1 px-2 fs-xs mb-2">
        {t('crm.messages.serviceWindowExpired')}
      </Alert>
      {errorMessage && (
        <Alert variant="danger" className="py-1 px-2 fs-xs mb-2" onClose={() => setErrorMessage('')} dismissible>
          {errorMessage}
        </Alert>
      )}

      {templatesLoading ? (
        <p className="text-muted fs-sm mb-0">{t('crm.messages.loadingTemplates')}</p>
      ) : templates.length === 0 ? (
        <p className="text-muted fs-sm mb-0">
          {t('crm.messages.noTemplates')}
        </p>
      ) : (
        <Row className="g-2 align-items-end">
          <Col md={variables.length > 0 ? 4 : 8}>
            <FormLabel className="fs-xs mb-1">{t('crm.messages.templateLabel')}</FormLabel>
            <FormSelect size="sm" value={templateId} onChange={(e) => handleTemplateChange(e.target.value)} disabled={disabled || sending} required>
              <option value="">{t('crm.messages.selectTemplatePlaceholder')}</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </FormSelect>
          </Col>
          {selectedTemplate?.variable_labels.map((label, index) => (
            <Col md={3} key={index}>
              <FormLabel className="fs-xs mb-1">{label}</FormLabel>
              <FormControl
                size="sm"
                value={variables[index] || ''}
                onChange={(e) => setVariables((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))}
                disabled={disabled || sending}
                required
              />
            </Col>
          ))}
          <Col md="auto">
            <Button type="submit" variant="primary" size="sm" disabled={disabled || sending || !templateId}>
              {sending ? t('common.sending') : t('crm.messages.sendTemplate')}
            </Button>
          </Col>
        </Row>
      )}
    </Form>
  )
}

export default TemplateComposer
