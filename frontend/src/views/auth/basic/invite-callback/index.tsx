import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Spinner } from 'react-bootstrap'

// Puente entre el correo de invitación que manda Supabase Auth
// (auth.admin.inviteUserByEmail, ver backend/src/lib/email.js) y nuestro
// flujo de invitación propio (tabla `invitations`, token). El link del
// correo es un magic-link de Supabase: al abrirlo, supabase-js detecta el
// access_token en la URL y establece una sesión automáticamente — sesión
// que no queremos (el usuario todavía no eligió contraseña ni pasó por
// nuestro /auth/sign-up). Por eso esta pantalla cierra esa sesión de
// inmediato y redirige al signup normal con nuestro propio token.
const InviteCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')

  useEffect(() => {
    let isMounted = true

    supabase.auth.signOut().finally(() => {
      if (!isMounted) return
      navigate(inviteToken ? `/auth/sign-up?invite=${inviteToken}` : '/auth/sign-up', { replace: true })
    })

    return () => {
      isMounted = false
    }
  }, [inviteToken, navigate])

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center px-3">
      <Spinner animation="border" variant="primary" />
    </div>
  )
}

export default InviteCallback
