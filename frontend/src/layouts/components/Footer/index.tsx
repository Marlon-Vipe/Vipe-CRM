import { currentYear, META_DATA } from '@/config/constants'
import { Col, Container, Row } from 'react-bootstrap'

const Footer = () => {
  return (
    <>
      <footer className="footer">
        <Container fluid>
          <Row>
            <Col xs={12} className="text-center">
              © {currentYear} {META_DATA.name} By <span className="fw-semibold">{META_DATA.author}</span>
            </Col>
          </Row>
        </Container>
      </footer>
    </>
  )
}

export default Footer
