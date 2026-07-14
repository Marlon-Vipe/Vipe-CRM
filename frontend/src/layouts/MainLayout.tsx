import { useLayoutContext } from '@/context/useLayoutContext'
import { useAuth } from '@/hooks/useAuth'
import HorizontalLayout from '@/layouts/HorizontalLayout'
import VerticalLayout from '@/layouts/VerticalLayout'
import { Outlet } from 'react-router'
import { Button, Spinner } from 'react-bootstrap'

const MainLayout = () => {
  const { orientation } = useLayoutContext()
  const { isAuthenticated, loading, tenantId, membershipError, refreshMembership } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  // Autenticado pero sin tenant resuelto todavía: puede ser el fallo de
  // membershipError, o la ventana breve mientras completePendingSignup
  // termina de crear el tenant tras confirmar el email. Sin esta pantalla,
  // cada hook de datos de la app queda esperando un tenantId que nunca
  // llega — spinner infinito sin ninguna pista de qué pasó.
  if (!loading && !tenantId) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center px-3">
        {membershipError ? (
          <>
            <p className="text-danger mb-3">{membershipError}</p>
            <Button variant="primary" onClick={() => refreshMembership()}>
              Reintentar
            </Button>
          </>
        ) : (
          <>
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted mb-0">Configurando tu cuenta...</p>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {orientation === 'vertical' && <VerticalLayout><Outlet /></VerticalLayout>}
      {orientation === 'horizontal' && <HorizontalLayout><Outlet /></HorizontalLayout>}
    </>
  )
}

export default MainLayout