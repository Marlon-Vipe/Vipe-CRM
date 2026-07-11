import Icon from '@/components/wrappers/Icon'
import { Link, useNavigate } from 'react-router'
import { Badge, Card, CardBody, CardFooter, CardTitle, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { STATUS_LABEL, STATUS_VARIANT, TYPE_LABEL, type PropertyType } from './data'

const formatPrice = (price: number | null, currency: string) => {
  if (price == null) return 'Precio a consultar'
  const formatted = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 0 }).format(price)
  return `${currency === 'USD' ? 'US$' : 'RD$'} ${formatted}`
}

interface Props {
  product: PropertyType
  onDelete: (propertyId: string) => void
}

const Page = ({ product, onDelete }: Props) => {
  const { id, price, currency, imageUrl, title, status, type, sector, city, bedrooms, bathrooms, areaM2 } = product
  const navigate = useNavigate()

  return (
    <Card className="h-100 mb-2">
      <Badge bg={STATUS_VARIANT[status]} className="badge-label fs-base rounded position-absolute top-0 start-0 m-3">
        {STATUS_LABEL[status]}
      </Badge>

      <div className="position-absolute top-0 end-0 m-2">
        <Dropdown align="end">
          <DropdownToggle className="btn btn-icon btn-sm drop-arrow-none btn-ghost-light text-muted content-none" type="button">
            <Icon icon="ellipsis-vertical" className="fs-lg" />
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={() => navigate(`/crm/propiedades/${id}/editar`)}>
              <Icon icon="square-pen" className="me-2" /> Editar
            </DropdownItem>
            <DropdownItem className="text-danger" onClick={() => onDelete(id)}>
              <Icon icon="trash-2" className="me-2" /> Eliminar
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <CardBody className="pb-0">
        <div className="p-3">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="img-fluid rounded" />
          ) : (
            <div className="d-flex align-items-center justify-content-center rounded bg-light-subtle" style={{ height: 160 }}>
              <Icon icon="home" className="fs-1 text-muted" />
            </div>
          )}
        </div>

        <CardTitle as="h6" className="fs-sm lh-base mb-2">
          <Link to={`/crm/propiedades/${id}/editar`} className="link-reset">
            {title}
          </Link>
        </CardTitle>

        <p className="text-muted fs-xs mb-2">
          <Icon icon="map-pin" className="me-1" />
          {sector || 'Sector sin especificar'}
          {city ? `, ${city}` : ''}
        </p>

        <div className="d-flex align-items-center gap-3 text-muted fs-xs">
          {!!bedrooms && (
            <span>
              <Icon icon="bed-double" className="me-1" />
              {bedrooms}
            </span>
          )}
          {bathrooms != null && (
            <span>
              <Icon icon="bath" className="me-1" />
              {bathrooms}
            </span>
          )}
          {areaM2 != null && (
            <span>
              <Icon icon="ruler" className="me-1" />
              {areaM2} m²
            </span>
          )}
        </div>
      </CardBody>

      <CardFooter className="bg-transparent d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-primary">{formatPrice(price, currency)}</h5>
        <Badge bg={type === 'venta' ? 'primary' : 'dark'} className="badge-label">
          {TYPE_LABEL[type]}
        </Badge>
      </CardFooter>
    </Card>
  )
}

export default Page
