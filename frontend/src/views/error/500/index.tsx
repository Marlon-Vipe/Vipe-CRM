import AuthImage from '@/assets/images/auth-card-bg.svg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'


const Page = () => {
  const { t } = useTranslation()
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <Card className="p-4">
                <div className="position-absolute top-0 end-0" style={{ width: '180px' }}>
                  <img src={AuthImage} className="auth-card-bg-img" alt="auth-card-bg" />
                </div>
                <div className="auth-brand text-center mb-2">
                  <AuthLogo />
                </div>
                <div className="p-4 text-center">
                  <div className="error-text-alt fs-72 text-danger">500</div>
                  <h3 className="fw-bold text-uppercase">{t('errors.serverError.title')}</h3>
                  <p className="text-muted fs-5">{t('errors.serverError.message')}</p>
                  <div className="mt-4 d-flex justify-content-center gap-1">
                    <Button variant="primary">{t('common.retry')}</Button>
                    <Button variant="outline-info">{t('errors.contactSupport')}</Button>
                  </div>
                </div>
              </Card>
              <p className="text-center text-muted mt-4 mb-0">
                © {currentYear} {META_DATA.name} — by <span className="fw-semibold">{META_DATA.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default Page
