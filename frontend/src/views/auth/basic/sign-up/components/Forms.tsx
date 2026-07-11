import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { useAuth } from '@/hooks/useAuth'
import { completeSignup } from '@/lib/api'
import { setPendingTenantName } from '@/lib/pendingTenant'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Button, Form, FormCheck, FormControl, FormLabel } from 'react-bootstrap'

const Forms = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const isSubmittingRef = useRef(false)

  const [fullName, setFullName] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreement, setAgreement] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Guardia inmediata contra un doble clic disparando dos signups
    // concurrentes para el mismo usuario.
    if (isSubmittingRef.current) return

    setErrorMessage('')

    if (!agreement) {
      setErrorMessage('Debes aceptar los Términos y Condiciones para continuar.')
      return
    }
    if (!agencyName.trim()) {
      setErrorMessage('Ingresa el nombre de tu agencia.')
      return
    }

    isSubmittingRef.current = true
    setSubmitting(true)
    try {
      const { data, error } = await signUp(email, password, { data: { full_name: fullName } })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      if (data.session) {
        // Confirmación de email deshabilitada: ya hay sesión, terminamos el
        // signup creando el tenant de una vez.
        await completeSignup({ accessToken: data.session.access_token, tenantName: agencyName })
        navigate('/')
      } else {
        // El proyecto exige confirmar el email primero: el tenant se crea en
        // el primer sign-in exitoso (ver AuthContext.completePendingSignup).
        setPendingTenantName(email, agencyName)
        setPendingConfirmationEmail(email)
      }
    } catch (error) {
      setErrorMessage((error as Error).message || 'No se pudo completar el registro.')
    } finally {
      isSubmittingRef.current = false
      setSubmitting(false)
    }
  }

  if (pendingConfirmationEmail) {
    return (
      <Alert variant="success">
        Te enviamos un correo de confirmación a <strong>{pendingConfirmationEmail}</strong>. Abre el enlace para
        activar tu cuenta y completar la creación de tu agencia.
      </Alert>
    )
  }

  return (
    <Form onSubmit={handleSubmit}>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <div className="mb-3">
        <FormLabel>
          Nombre de la agencia <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="text" required value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
      </div>
      <div className="mb-3">
        <FormLabel>
          Tu nombre completo <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="mb-3">
        <FormLabel>
          Correo electrónico <span className="text-danger">*</span>
        </FormLabel>
        <FormControl type="email" placeholder="tu@agencia.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="mb-3" data-password="bar">
        <PasswordInputWithStrength id="password" label="Contraseña" name="password" password={password} setPassword={setPassword} showIcon placeholder="••••••••" />
      </div>
      <div className="mb-3">
        <FormCheck>
          <Form.Check.Input
            className="form-check-input-light fs-14"
            type="checkbox"
            id="termAndPolicy"
            checked={agreement}
            onChange={(e) => setAgreement(e.target.checked)}
          />
          <Form.Check.Label htmlFor="termAndPolicy">Acepto los Términos y Condiciones</Form.Check.Label>
        </FormCheck>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={submitting}>
          {submitting ? 'Creando agencia...' : 'Crear agencia'}
        </Button>
      </div>
    </Form>
  )
}

export default Forms
