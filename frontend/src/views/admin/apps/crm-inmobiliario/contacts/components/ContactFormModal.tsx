import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { normalizePhoneE164 } from '@/utils/helpers'
import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, FormSelect, FormText, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { getContactSourceLabels, getContactTypeLabels } from './data'

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
  const { t } = useTranslation()
  const contactTypeLabels = getContactTypeLabels(t)
  const contactSourceLabels = getContactSourceLabels(t)
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
      setErrorMessage(t('crm.contacts.form.nameRequired'))
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
        <ModalTitle as="h5">{form.id ? t('crm.contacts.form.editTitle') : t('crm.contacts.form.createTitle')}</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <div className="mb-3">
            <FormLabel>
              {t('crm.contacts.form.name')} <span className="text-danger">*</span>
            </FormLabel>
            <FormControl required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="mb-3">
            <FormLabel>{t('crm.contacts.form.phone')}</FormLabel>
            <FormControl value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <FormText>{t('crm.contacts.form.phoneHint')}</FormText>
          </div>
          <div className="mb-3">
            <FormLabel>{t('auth.fields.email')}</FormLabel>
            <FormControl type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="mb-3">
            <FormLabel>{t('crm.contacts.form.type')}</FormLabel>
            <FormSelect value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContactFormValues['type'] })}>
              <option value="">{t('crm.contacts.form.typeUnspecified')}</option>
              {Object.entries(contactTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="mb-0">
            <FormLabel>{t('crm.contacts.form.source')}</FormLabel>
            <FormSelect value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {Object.entries(contactSourceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>
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

export default ContactFormModal
