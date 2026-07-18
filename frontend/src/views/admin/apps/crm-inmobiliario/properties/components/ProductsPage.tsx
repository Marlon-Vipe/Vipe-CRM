import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Button, Col, Row, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import PropertyCard from './PropertyCard'
import ProductFilter from './ProductFilter'
import { createDefaultFilters, filterProperties, getPriceBounds, type PropertyFiltersState } from './data'
import { useProperties } from './useProperties'

const ProductsPage = () => {
  const { t } = useTranslation()
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false)
  const { properties, loading, error: loadError, reload } = useProperties()
  const { tenantId } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [filters, setFilters] = useState<PropertyFiltersState>(() => createDefaultFilters(properties))

  // Los límites del rango de precio dependen de las propiedades cargadas —
  // se recalculan cuando cambian (ej. al terminar de cargar, o tras crear
  // una propiedad con un precio fuera del rango anterior), pero sin pisar
  // el resto de los filtros que el usuario ya haya aplicado ni un rango que
  // ya haya ajustado manualmente dentro de los límites vigentes.
  useEffect(() => {
    if (loading) return
    const [min, max] = getPriceBounds(properties, filters.priceCurrency)
    setFilters((prev) => (prev.priceRange[0] === min && prev.priceRange[1] === max ? prev : { ...prev, priceRange: [min, max] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, properties, filters.priceCurrency])

  const filteredProperties = filterProperties(properties, filters)

  const handleDelete = async (propertyId: string) => {
    if (!tenantId) return
    if (!window.confirm(t('crm.properties.deleteConfirm'))) return
    const { error } = await supabase.from('properties').delete().eq('id', propertyId).eq('tenant_id', tenantId)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    reload()
  }

  return (
    <>
      <Row className="mb-2">
        <Col lg={12}>
          <div className="bg-light-subtle rounded border p-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="d-lg-none">
                <Button variant="light" className="btn-icon" onClick={() => setIsOffcanvasOpen(true)}>
                  <Icon icon="menu-4" className="fs-lg" />
                </Button>
              </div>
              <h3 className="mb-0 fs-xl flex-grow-1">{t('crm.properties.count', { count: filteredProperties.length })}</h3>
              <Button variant="primary" onClick={() => navigate('/crm/propiedades/nueva')}>
                <Icon icon="plus" className="fs-sm me-2" /> {t('crm.properties.addProperty')}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Row className="g-2">
        <ProductFilter properties={properties} filters={filters} onFiltersChange={setFilters} isOffcanvasOpen={isOffcanvasOpen} setIsOffcanvasOpen={setIsOffcanvasOpen} />

        <Col xl={9}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : loadError ? (
            <div className="text-center py-5">
              <p className="text-danger mb-3">{loadError}</p>
              <Button variant="primary" onClick={reload}>
                {t('common.retry')}
              </Button>
            </div>
          ) : properties.length === 0 ? (
            <p className="text-muted text-center py-5">{t('crm.properties.noProperties')}</p>
          ) : filteredProperties.length === 0 ? (
            <p className="text-muted text-center py-5">{t('common.noResults')}</p>
          ) : (
            <Row className="row-cols-xxl-4 row-cols-lg-3 row-cols-sm-2 row-col-1 g-2">
              {filteredProperties.map((property) => (
                <Col key={property.id}>
                  <PropertyCard product={property} onDelete={handleDelete} />
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </>
  )
}

export default ProductsPage
