import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Button, Col, Row, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { buildStateData } from './components/data'
import DealsByStageChart from './components/DealsByStageChart'
import EcomStats from './components/EcomStats'
import UpcomingActivities from './components/UpcomingActivities'
import { useDashboardStats } from './components/useDashboardStats'

const Page = () => {
  const { t } = useTranslation()
  const { newLeadsCount, activePropertiesCount, openDealsCount, pendingActivitiesCount, dealsByStage, upcomingActivities, loading, error, reload } = useDashboardStats()

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <PageBreadcrumb title={t('nav.dashboard')} subtitle={t('nav.crmGroup')} />
        <div className="text-center py-5">
          <p className="text-danger mb-3">{error}</p>
          <Button variant="primary" onClick={reload}>
            {t('common.retry')}
          </Button>
        </div>
      </>
    )
  }

  const stateData = buildStateData(t, { newLeadsCount, activePropertiesCount, openDealsCount, pendingActivitiesCount })

  return (
    <>
      <PageBreadcrumb title={t('nav.dashboard')} subtitle={t('nav.crmGroup')} />

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
