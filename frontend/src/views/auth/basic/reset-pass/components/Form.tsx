import { supabase } from '@/lib/supabaseClient'
import { translateAuthError } from '@/utils/authErrors'
import { useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel } from 'react-bootstrap'

const ResetForm = () => {
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
      setErrorMessage(translateAuthError(error.message))
      return
    }
    // Por seguridad, Supabase no revela si el correo existe o no — el mismo
    // mensaje se muestra en ambos casos.
    setSent(true)
  }

  if (sent) {
    return (
      <Alert variant="success">
        Si <strong>{email}</strong> tiene una cuenta con nosotros, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de
        entrada (y la carpeta de spam).
      </Alert>
    )
  }

  return (
    <Form onSubmit={handleSubmit}>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <div className="mb-3">
        <FormLabel>
          Correo electrónico <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="email" placeholder="tu@agencia.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>
      </div>
    </Form>
  )
}

export default ResetForm
