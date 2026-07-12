import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import { ACTIVITY_TYPE_LABELS } from './activityLabels'

interface Props {
  show: boolean
  onHide: () => void
  onSaved: () => void
  contactId?: string
  dealId?: string
}

const ActivityFormModal = ({ show, onHide, onSaved, contactId, dealId }: Props) => {
  const { tenantId, user } = useAuth()
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
        <ModalTitle as="h5">Nueva actividad</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <div className="mb-3">
            <FormLabel>Tipo</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="mb-3">
            <FormLabel>Fecha/hora (opcional)</FormLabel>
            <FormControl type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div className="mb-0">
            <FormLabel>Notas</FormLabel>
            <FormControl as="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onHide} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default ActivityFormModal
