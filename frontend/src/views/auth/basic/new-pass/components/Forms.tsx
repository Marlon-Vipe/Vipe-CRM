import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { supabase } from '@/lib/supabaseClient'
import { translateAuthError } from '@/utils/authErrors'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router'
import { Alert, Button, Form, FormControl, FormLabel, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

const NewPassForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    // El enlace del correo de recuperación hace que supabase-js establezca
    // una sesión temporal (evento PASSWORD_RECOVERY) al cargar la página —
    // sin eso, no hay forma legítima de cambiar la contraseña acá.
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      if (data.session) setHasRecoverySession(true)
      setCheckingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setHasRecoverySession(true)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage(t('auth.newPass.passwordsDontMatch'))
      return
    }
    if (password.length < 6) {
      setErrorMessage(t('auth.newPass.passwordTooShort'))
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      setErrorMessage(translateAuthError(t, error.message))
      return
    }

    navigate('/', { replace: true })
  }

  if (checkingSession) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" size="sm" />
      </div>
    )
  }

  if (!hasRecoverySession) {
    return (
      <Alert variant="warning">
        {t('auth.newPass.invalidOrExpiredLink')}{' '}
        <Link to="/auth/reset-pass" className="fw-semibold text-decoration-underline">
          {t('auth.newPass.requestNewLink')}
        </Link>
        .
      </Alert>
    )
  }

  return (
    <Form onSubmit={handleSubmit}>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <div className="mb-3" data-password="bar">
        <PasswordInputWithStrength
          id="newPassword"
          label={t('auth.newPass.newPassword')}
          name="new-password"
          password={password}
          setPassword={setPassword}
          showIcon
          placeholder="••••••••"
        />
      </div>
      <div className="mb-3">
        <FormLabel>
          {t('auth.newPass.confirmPassword')} <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={submitting}>
          {submitting ? t('common.saving') : t('auth.newPass.submit')}
        </Button>
      </div>
    </Form>
  )
}

export default NewPassForm
