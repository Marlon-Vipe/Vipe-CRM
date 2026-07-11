import AuthImage from '@/assets/images/auth-card-bg.svg'
import maintenanceImg from '@/assets/images/maintenance.svg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Button, Card, CardBody, Col, Container, Row } from 'react-bootstrap'


const Page = () => {
  return (
    <>
      <div className="auth-box d-flex align-items-center">
        <Container fluid="xxl">
          <Row className="align-items-center justify-content-center">
            <Col xl={6}>
              <Card className="mb-0">
                <div className="position-absolute top-0 end-0" style={{ width: '280px' }}>
                  <img src={AuthImage} className="auth-card-bg-img" alt="auth-card-bg" />
                </div>
                <CardBody>
                  <div className="auth-brand text-center mb-0">
                    <AuthLogo />
                  </div>
                  <div className="p-2 text-center">
                    <div className="w-md-50 mx-auto">
                      <img src={maintenanceImg} alt="Maintenance" className="img-fluid" />
                    </div>
                    <h3 className="fw-bold text-uppercase">Site Under Maintenance</h3>
                    <p className="text-muted">
                      We’re currently performing scheduled maintenance.
                      <br />
                      Please check back soon.
                    </p>
                    <Button variant="primary" className="mt-3 me-1">
                      Call Now
                    </Button>
                    &nbsp;
                    <Button variant="info" className="mt-3">
                      Email Us
                    </Button>
                  </div>
                  <p className="text-center text-muted mt-5 mb-0">
                    © {currentYear} {META_DATA.name} — by <span className="fw-semibold">{META_DATA.author}</span>
                  </p>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default Page
