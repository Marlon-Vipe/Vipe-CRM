import { supabase } from '@/lib/supabaseClient'
import { translateAuthError } from '@/utils/authErrors'
import { useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

const ResetForm = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/new-pass`,
    })

    setSubmitting(false)

    if (error) {
      setErrorMessage(translateAuthError(t, error.message))
      return
    }
    // Por seguridad, Supabase no revela si el correo existe o no — el mismo
    // mensaje se muestra en ambos casos.
    setSent(true)
  }

  if (sent) {
    return <Alert variant="success">{t('auth.resetPass.sent', { email })}</Alert>
  }

  return (
    <Form onSubmit={handleSubmit}>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <div className="mb-3">
        <FormLabel>
          {t('auth.fields.email')} <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="email" placeholder="tu@agencia.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={submitting}>
          {submitting ? t('auth.resetPass.sendingLink') : t('auth.resetPass.submit')}
        </Button>
      </div>
    </Form>
  )
}

export default ResetForm
