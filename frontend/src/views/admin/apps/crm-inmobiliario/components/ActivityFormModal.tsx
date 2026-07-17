import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { getActivityTypeLabels } from './activityLabels'

interface Props {
  show: boolean
  onHide: () => void
  onSaved: () => void
  contactId?: string
  dealId?: string
}

const ActivityFormModal = ({ show, onHide, onSaved, contactId, dealId }: Props) => {
  const { t } = useTranslation()
  const { tenantId, user } = useAuth()
  const activityTypeLabels = getActivityTypeLabels(t)
  const [type, setType] = useState('llamada')
  const [dueAt, setDueAt] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!tenantId) return

    setSubmitting(true)
    setErrorMessage('')

    const { error } = await supabase.from('activities').insert({
      tenant_id: tenantId,
      contact_id: contactId || null,
      deal_id: dealId || null,
      type,
      status: 'pendiente',
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      notes: notes.trim() || null,
      assigned_to: user?.id,
    })

    setSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setType('llamada')
    setDueAt('')
    setNotes('')
    onSaved()
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide}>
      <ModalHeader closeButton>
        <ModalTitle as="h5">{t('crm.activityForm.title')}</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <div className="mb-3">
            <FormLabel>{t('crm.activityForm.type')}</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(activityTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="mb-3">
            <FormLabel>{t('crm.activityForm.dueDate')}</FormLabel>
            <FormControl type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div className="mb-0">
            <FormLabel>{t('crm.activityForm.notes')}</FormLabel>
            <FormControl as="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onHide} type="button">
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default ActivityFormModal
