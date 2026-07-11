import authimg from '@/assets/images/auth-card-bg.svg'
import auth from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import LoginForm from './components/Form'


const Page = () => {
  return (
    <>
      <div className="auth-box p-0 w-100">
        <Row className="w-100 g-0">
          <Col md="auto">
            <Card className="auth-box-form border-0 mb-0">
              <div className="position-absolute top-0 end-0" style={{ width: '180px' }}>
                <img src={authimg} className="auth-card-bg-img" alt="auth-card-bg" />
              </div>
              <CardBody className="min-vh-100 position-relative d-flex flex-column justify-content-center">
                <div className="auth-brand mb-0 text-center">
                  <AuthLogo />
                </div>
                <div className="mt-auto">
                  <p className="text-muted text-center auth-sub-text mx-auto">Let’s get you signed in. Enter your email and password to continue.</p>

                  <LoginForm />
                </div>
                <p className="text-muted text-center mt-4 mb-0">
                  New here?&nbsp;
                  <Link to="/auth/split/sign-up" className="text-decoration-underline link-offset-3 fw-semibold">
                    Create an account
                  </Link>
                </p>
                <p className="text-center text-muted mt-auto mb-0">
                  © {currentYear} {META_DATA.name} — by <span className="fw-bold">{META_DATA.author}</span>
                </p>
              </CardBody>
            </Card>
          </Col>
          <Col>
            <div className="h-100 position-relative card-side-img rounded-0 overflow-hidden" style={{ backgroundImage: `url(${auth})` }}>
              <div className="p-4 card-img-overlay auth-overlay d-flex align-items-end justify-content-center" />
            </div>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default Page
