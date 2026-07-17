import ChartJs from '@/components/wrappers/ChartJs'
import { getColor } from '@/utils/helpers'
import { BarController, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { useCallback } from 'react'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import type { DealsByStage } from './useDashboardStats'

const DealsByStageChart = ({ data }: { data: DealsByStage[] }) => {
  const { t } = useTranslation()
  const getOptions = useCallback(
    () => ({
      data: {
        labels: data.map((stage) => stage.stageName),
        datasets: [
          {
            label: t('crm.dashboard.dealsByStage'),
            data: data.map((stage) => stage.count),
            backgroundColor: getColor('chart-primary'),
            borderRadius: 6,
            barThickness: 28,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { precision: 0 } } },
      },
    }),
    [data, t]
  )

  return (
    <Card className="h-100">
      <CardHeader>
        <CardTitle as="h4">{t('crm.dashboard.dealsByStage')}</CardTitle>
      </CardHeader>
      <CardBody>
        {data.length === 0 ? (
          <p className="text-muted text-center py-5 mb-0">{t('crm.dashboard.noDeals')}</p>
        ) : (
          <ChartJs height={300} type="bar" getOptions={getOptions} plugins={[BarController, BarElement, CategoryScale, LinearScale]} />
        )}
      </CardBody>
    </Card>
  )
}

export default DealsByStageChart
