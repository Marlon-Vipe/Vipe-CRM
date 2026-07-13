import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { normalizePhoneE164 } from '@/utils/helpers'
import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, FormSelect, FormText, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import { CONTACT_SOURCE_LABELS, CONTACT_TYPE_LABELS } from './data'

export interface ContactFormValues {
  id?: string
  name: string
  phone: string
  email: string
  type: '' | 'comprador' | 'vendedor' | 'arrendatario'
  source: string
  notes: string
}

export type ContactLike = {
  id: string
  name: string
  phone: string | null
  email: string | null
  type: 'comprador' | 'vendedor' | 'arrendatario' | null
  source: string
}

const EMPTY_FORM: ContactFormValues = { name: '', phone: '', email: '', type: '', source: 'otro', notes: '' }

interface Props {
  show: boolean
  onHide: () => void
  onSaved: () => void
  contact?: ContactLike | null
}

const ContactFormModal = ({ show, onHide, onSaved, contact }: Props) => {
  const { tenantId, user } = useAuth()
  const [form, setForm] = useState<ContactFormValues>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!show) return
    setErrorMessage('')
    if (contact) {
      setForm({
        id: contact.id,
        name: contact.name,
        phone: contact.phone || '',
        email: contact.email || '',
        type: contact.type || '',
        source: contact.source,
        notes: '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [show, contact])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!tenantId) return
    if (!form.name.trim()) {
      setErrorMessage('El nombre es requerido.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const payload = {
      name: form.name.trim(),
      phone: normalizePhoneE164(form.phone),
      email: form.email.trim() || null,
      type: form.type || null,
      source: form.source,
    }

    const { error } = form.id
      ? await supabase.from('contacts').update(payload).eq('id', form.id).eq('tenant_id', tenantId)
      : await supabase.from('contacts').insert({ ...payload, tenant_id: tenantId, assigned_agent_id: user?.id })

    setSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    onSaved()
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide}>
      <ModalHeader closeButton>
        <ModalTitle as="h5">{form.id ? 'Editar contacto' : 'Nuevo contacto'}</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <div className="mb-3">
            <FormLabel>
              Nombre <span className="text-danger">*</span>
            </FormLabel>
            <FormControl required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="mb-3">
            <FormLabel>Teléfono</FormLabel>
            <FormControl value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <FormText>Se guarda en formato internacional (+1...) para que coincida con los mensajes de WhatsApp de este contacto.</FormText>
          </div>
          <div className="mb-3">
            <FormLabel>Correo electrónico</FormLabel>
            <FormControl type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="mb-3">
            <FormLabel>Tipo</FormLabel>
            <FormSelect value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContactFormValues['type'] })}>
              <option value="">Sin especificar</option>
              {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="mb-0">
            <FormLabel>Origen</FormLabel>
            <FormSelect value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {Object.entries(CONTACT_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>
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

export default ContactFormModal
