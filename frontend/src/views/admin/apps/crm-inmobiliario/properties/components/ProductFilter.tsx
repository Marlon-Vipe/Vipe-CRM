import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { useMemo, useState } from 'react'
import { Badge, Card, CardBody, Col, FormCheck, Nav, NavItem, Offcanvas } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { getTrackBackground, Range } from 'react-range'
import { Direction, IRenderThumbParams, IRenderTrackParams } from 'react-range/lib/types'
import { getTypeLabels, getStatusLabels, type PropertyType } from './data'

const STEP = 1000
const MIN = 0
const MAX = 15000000

const renderTrack = ({
  props,
  children,
  values,
  direction,
}: IRenderTrackParams & {
  values: number[]
  direction?: Direction
}) => (
  <div
    onMouseDown={props.onMouseDown}
    onTouchStart={props.onTouchStart}
    style={{
      ...props.style,
      height: '36px',
      display: 'flex',
      width: '100%',
    }}
  >
    <div
      ref={props.ref}
      style={{
        height: '4px',
        width: '100%',
        borderRadius: '4px',
        background: getTrackBackground({
          values,
          colors: values.length == 1 ? [getColor('chart-primary'), getColor('light')] : values.length == 2 ? [getColor('light'), getColor('chart-primary'), getColor('light')] : ['#000', getColor('chart-primary'), getColor('chart-secondary'), getColor('light')],
          min: MIN,
          max: MAX,
          direction,
        }),
        alignSelf: 'center',
      }}
    >
      {children}
    </div>
  </div>
)

const renderThumb = ({ props }: IRenderThumbParams) => (
  <div
    {...props}
    key={props.key}
    style={{
      ...props.style,
      height: '16px',
      width: '16px',
      borderRadius: '50%',
      backgroundColor: getColor('primary'),
    }}
  />
)

function countBy<T extends string>(properties: PropertyType[], getKey: (property: PropertyType) => T | null): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const property of properties) {
    const key = getKey(property)
    if (!key) continue
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

const ProductFilter = ({
  properties,
  isOffcanvasOpen,
  setIsOffcanvasOpen,
}: {
  properties: PropertyType[]
  isOffcanvasOpen: boolean
  setIsOffcanvasOpen: (value: boolean) => void
}) => {
  const { t } = useTranslation()
  const [values, setValues] = useState([0, 5000000])

  const typeLabels = getTypeLabels(t)
  const statusLabels = getStatusLabels(t)

  const typeCounts = useMemo(() => countBy(properties, (p) => p.type), [properties])
  const statusCounts = useMemo(() => countBy(properties, (p) => p.status), [properties])
  const sectorCounts = useMemo(() => countBy(properties, (p) => p.sector), [properties])

  return (
    <Col xl={3}>
      <Offcanvas responsive="lg" placement="start" show={isOffcanvasOpen} onHide={() => setIsOffcanvasOpen(false)}>
        <Card className="h-100">
          <CardBody className="p-0">
            <div className="p-3 border-bottom border-dashed">
              <div className="app-search">
                <input type="search" className="form-control" placeholder={t('crm.properties.filter.searchPlaceholder')} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </div>

            <div className="p-3 border-bottom border-dashed">
              <div className="d-flex mb-2 justify-content-between align-items-center">
                <h5 className="mb-0">{t('crm.properties.filter.type')}</h5>
              </div>
              <Nav className="flex-column">
                {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((id) => (
                  <NavItem key={id} className="d-flex align-items-center gap-2 text-muted py-1">
                    <FormCheck type="checkbox" id={`type-${id}`} label={typeLabels[id]} className="form-check-label flex-grow-1" />
                    <Badge bg="light" text="dark" className="ms-2 text-bg-light">
                      {typeCounts[id] || 0}
                    </Badge>
                  </NavItem>
                ))}
              </Nav>
            </div>

            <div className="p-3 border-bottom border-dashed">
              <div className="d-flex mb-2 justify-content-between align-items-center">
                <h5 className="mb-0">{t('crm.properties.filter.status')}</h5>
              </div>

              {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((id) => (
                <NavItem key={id} className="d-flex align-items-center gap-2 text-muted py-1">
                  <FormCheck type="checkbox" id={`status-${id}`} label={statusLabels[id]} className="flex-grow-1" />
                  <Badge bg="light" text="dark" className="ms-2 text-bg-light">
                    {statusCounts[id] || 0}
                  </Badge>
                </NavItem>
              ))}
            </div>

            <div className="p-3 border-bottom">
              <h5 className="mb-0">{t('crm.properties.filter.price')}</h5>

              <Range step={STEP} min={MIN} max={MAX} values={values} onChange={(values) => setValues(values)} renderTrack={(params) => renderTrack({ ...params, values })} renderThumb={renderThumb} />

              <div className="d-flex gap-2 align-items-center mt-1">
                <div className="form-control form-control-sm text-center" id="price-filter-low">
                  {values[0].toLocaleString('es-DO')}
                </div>
                <span className="fw-semibold text-muted">{t('crm.properties.filter.priceRangeTo')}</span>
                <div className="form-control form-control-sm text-center" id="price-filter-high">
                  {values[1].toLocaleString('es-DO')}
                </div>
              </div>
            </div>

            <div className="p-3">
              <div className="d-flex mb-2 justify-content-between align-items-center">
                <h5 className="mb-0">{t('crm.properties.filter.sector')}</h5>
              </div>
              {Object.keys(sectorCounts).length === 0 && <p className="text-muted fs-xs">{t('crm.properties.filter.noSectors')}</p>}
              {Object.entries(sectorCounts).map(([sector, count]) => (
                <div className="form-check py-1 d-flex align-items-center gap-2" key={sector}>
                  <FormCheck type="checkbox" id={`sector-${sector}`} label={sector} className="flex-grow-1" />
                  <Badge bg="light" text="dark" className="text-bg-light">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </Offcanvas>
    </Col>
  )
}

export default ProductFilter
