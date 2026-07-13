import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row, Spinner } from 'react-bootstrap'

import { buildStateData } from './components/data'
import DealsByStageChart from './components/DealsByStageChart'
import EcomStats from './components/EcomStats'
import UpcomingActivities from './components/UpcomingActivities'
import { useDashboardStats } from './components/useDashboardStats'

const Page = () => {
  const { newLeadsCount, activePropertiesCount, openDealsCount, pendingActivitiesCount, dealsByStage, upcomingActivities, loading } = useDashboardStats()

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  const stateData = buildStateData({ newLeadsCount, activePropertiesCount, openDealsCount, pendingActivitiesCount })

  return (
    <>
      <PageBreadcrumb title="Dashboard" subtitle="CRM Inmobiliario" />

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {stateData.map((item, index) => (
          <Col key={index}>
            <EcomStats item={item} />
          </Col>
        ))}
      </Row>

      <Row>
        <Col xxl={7}>
          <DealsByStageChart data={dealsByStage} />
        </Col>
        <Col xxl={5}>
          <UpcomingActivities activities={upcomingActivities} />
        </Col>
      </Row>
    </>
  )
}

export default Page
