import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Button, Col, Row, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import PropertyCard from './PropertyCard'
import ProductFilter from './ProductFilter'
import { useProperties } from './useProperties'

const ProductsPage = () => {
  const { t } = useTranslation()
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false)
  const { properties, loading, error: loadError, reload } = useProperties()
  const { tenantId } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

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
              <h3 className="mb-0 fs-xl flex-grow-1">{t('crm.properties.count', { count: properties.length })}</h3>
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
        <ProductFilter properties={properties} isOffcanvasOpen={isOffcanvasOpen} setIsOffcanvasOpen={setIsOffcanvasOpen} />

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
          ) : (
            <Row className="row-cols-xxl-4 row-cols-lg-3 row-cols-sm-2 row-col-1 g-2">
              {properties.map((property) => (
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
