import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { stateData } from './components/data'
import EcomStats from './components/EcomStats'
import ProductInventory from './components/ProductInventory'
import RecentOrders from './components/RecentOrders'
import SalesAnalytics from './components/SalesAnalytics'
import TotalSales from './components/TotalSales'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="eCommerce" subtitle="Dashboards" />

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {stateData.map((item, index) => (
          <Col key={index}>
            <EcomStats item={item} />
          </Col>
        ))}
      </Row>

      <Row>
        <Col xs={12}>
          <Card>
            <CardBody className="p-0">
              <Row className="g-0">
                <Col xxl={3} xl={6} className="order-xl-1 order-xxl-0">
                  <TotalSales />
                  <hr className="d-xxl-none border-light m-0" />
                </Col>

                <Col xxl={9} className="order-xl-3 order-xxl-1">
                  <SalesAnalytics />
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xxl={6}>
          <ProductInventory />
        </Col>
        <Col xxl={6}>
          <RecentOrders />
        </Col>
      </Row>
    </>
  )
}

export default Page
