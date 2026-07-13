import { useAuth } from '@/hooks/useAuth'
import { createInvitation } from '@/lib/api'
import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import { ROLE_LABELS, type MembershipRole } from './data'

interface Props {
  show: boolean
  onHide: () => void
  onSaved: () => void
}

const InviteFormModal = ({ show, onHide, onSaved }: Props) => {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MembershipRole>('agent')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [emailSent, setEmailSent] = useState<boolean | null>(null)

  useEffect(() => {
    if (show) {
      setErrorMessage('')
      setEmailSent(null)
    }
  }, [show])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) return

    setSubmitting(true)
    setErrorMessage('')

    try {
      const invitation = await createInvitation({
        accessToken: session.access_token,
        email: email.trim().toLowerCase(),
        role,
      })
      setEmail('')
      setRole('agent')
      setEmailSent(invitation.email_sent)
      onSaved()
      if (invitation.email_sent) onHide()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide}>
      <ModalHeader closeButton>
        <ModalTitle as="h5">Invitar agente</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          {emailSent === false && (
            <Alert variant="warning">
              La invitación se creó, pero no se pudo enviar el email automáticamente. Usa "Copiar enlace" en la lista de invitaciones
              pendientes para compartirla manualmente.
            </Alert>
          )}
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
