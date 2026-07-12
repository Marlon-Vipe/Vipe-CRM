import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import { ROLE_LABELS, type MembershipRole } from './data'

interface Props {
  show: boolean
  onHide: () => void
  onSaved: () => void
}

const InviteFormModal = ({ show, onHide, onSaved }: Props) => {
  const { tenantId, user } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MembershipRole>('agent')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!tenantId) return

    setSubmitting(true)
    setErrorMessage('')

    const { error } = await supabase.from('invitations').insert({
      tenant_id: tenantId,
      email: email.trim().toLowerCase(),
      role,
      token: crypto.randomUUID(),
      invited_by: user?.id,
    })

    setSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setEmail('')
    setRole('agent')
    onSaved()
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide}>
      <ModalHeader closeButton>
        <ModalTitle as="h5">Invitar agente</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <div className="mb-3">
            <FormLabel>
              Correo electrónico <span className="text-danger">*</span>
            </FormLabel>
            <FormControl type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-0">
            <FormLabel>Rol</FormLabel>
            <FormSelect value={role} onChange={(e) => setRole(e.target.value as MembershipRole)}>
              <option value="agent">{ROLE_LABELS.agent}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </FormSelect>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onHide} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Crear invitación'}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default InviteFormModal
