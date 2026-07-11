import authcard from '@/assets/images/auth-card-bg.svg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import { Card, Col, Container, Row } from 'react-bootstrap'
import LoginForm from './components/Form'


const Page = () => {
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <Card className="p-4">
                <div className="position-absolute top-0 end-0" style={{ width: '180px' }}>
                  <img src={authcard} className="auth-card-bg-img" alt="auth-card-bg" />
                </div>
                <div className="auth-brand text-center mb-4">
                  <AuthLogo />

                  <p className="text-muted w-lg-75 mt-3 mx-auto">Ingresa tu correo y contraseña para continuar.</p>
                </div>

                <LoginForm />

                <p className="text-muted text-center mt-4 mb-0">
                  ¿Nuevo por aquí?&nbsp;
                  <Link to="/auth/sign-up" className="text-decoration-underline link-offset-3 fw-semibold">
                    Crea una cuenta
                  </Link>
                </p>
              </Card>
              <p className="text-center text-muted mt-4 mb-0">
                © {currentYear} {META_DATA.name} — by
                <span className="fw-semibold">{META_DATA.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default Page
