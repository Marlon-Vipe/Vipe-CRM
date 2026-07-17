import { useAuth } from '@/hooks/useAuth'
import { createInvitation } from '@/lib/api'
import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import type { MembershipRole } from './data'

interface Props {
  show: boolean
  onHide: () => void
  onSaved: () => void
}

const InviteFormModal = ({ show, onHide, onSaved }: Props) => {
  const { t } = useTranslation()
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
        <ModalTitle as="h5">{t('team.inviteAgent')}</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          {emailSent === false && <Alert variant="warning">{t('team.emailNotSentWarning')}</Alert>}
          <div className="mb-3">
            <FormLabel>
              {t('auth.fields.email')} <span className="text-danger">*</span>
            </FormLabel>
            <FormControl type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-0">
            <FormLabel>{t('team.role')}</FormLabel>
            <FormSelect value={role} onChange={(e) => setRole(e.target.value as MembershipRole)}>
              <option value="agent">{t('common.roles.agent')}</option>
              <option value="admin">{t('common.roles.admin')}</option>
            </FormSelect>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onHide} type="button">
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t('common.sending') : t('team.createInvitation')}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default InviteFormModal
