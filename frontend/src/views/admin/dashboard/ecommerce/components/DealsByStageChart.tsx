import ChartJs from '@/components/wrappers/ChartJs'
import { getColor } from '@/utils/helpers'
import { BarController, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { useCallback } from 'react'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'

import type { DealsByStage } from './useDashboardStats'

const DealsByStageChart = ({ data }: { data: DealsByStage[] }) => {
  const getOptions = useCallback(
    () => ({
      data: {
        labels: data.map((stage) => stage.stageName),
        datasets: [
          {
            label: 'Negociaciones',
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
    [data]
  )

  return (
    <Card className="h-100">
      <CardHeader>
        <CardTitle as="h4">Negociaciones por etapa</CardTitle>
      </CardHeader>
      <CardBody>
        {data.length === 0 ? (
          <p className="text-muted text-center py-5 mb-0">Todavía no hay negociaciones registradas.</p>
        ) : (
          <ChartJs height={300} type="bar" getOptions={getOptions} plugins={[BarController, BarElement, CategoryScale, LinearScale]} />
        )}
      </CardBody>
    </Card>
  )
}

export default DealsByStageChart
