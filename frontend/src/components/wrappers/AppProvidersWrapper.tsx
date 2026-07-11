import { AuthProvider } from '@/context/AuthContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
import { useLocation, useNavigate } from 'react-router'
import React, { useEffect } from 'react'

// Debe montarse dentro de AuthProvider para poder leer la sesión de Supabase.
const AuthRedirectGate = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Espera a que se resuelva la sesión antes de decidir si redirige — si no,
    // redirige siempre al montar (loading inicial en true) aunque el usuario
    // sí tenga una sesión válida. Tampoco redirige si ya está en una ruta de
    // auth (sign-in, sign-up, reset-pass, etc.), o nunca se podría llegar a
    // sign-up sin sesión previa.
    if (!loading && !isAuthenticated && !location.pathname.startsWith('/auth')) {
      navigate('/auth/sign-in', { replace: true })
    }
  }, [loading, isAuthenticated, location.pathname, navigate])

  return <>{children}</>
}

const AppProvidersWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <LayoutProvider>
        <NotificationProvider>
          <AuthRedirectGate>{children}</AuthRedirectGate>
        </NotificationProvider>
      </LayoutProvider>
    </AuthProvider>
  )
}

export default AppProvidersWrapper
