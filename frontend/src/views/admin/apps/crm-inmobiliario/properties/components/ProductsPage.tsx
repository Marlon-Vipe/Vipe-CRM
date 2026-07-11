import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Col, Row, Spinner } from 'react-bootstrap'
import PropertyCard from './PropertyCard'
import ProductFilter from './ProductFilter'
import { useProperties } from './useProperties'

const ProductsPage = () => {
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false)
  const { properties, loading, reload } = useProperties()
  const { tenantId } = useAuth()
  const navigate = useNavigate()

  const handleDelete = async (propertyId: string) => {
    if (!tenantId) return
    if (!window.confirm('¿Eliminar esta propiedad? Esta acción no se puede deshacer.')) return
    const { error } = await supabase.from('properties').delete().eq('id', propertyId).eq('tenant_id', tenantId)
    if (error) {
      window.alert(error.message)
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
              <h3 className="mb-0 fs-xl flex-grow-1">{properties.length} Propiedades</h3>
              <Button variant="primary" onClick={() => navigate('/crm/propiedades/nueva')}>
                <Icon icon="plus" className="fs-sm me-2" /> Agregar propiedad
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-2">
        <ProductFilter properties={properties} isOffcanvasOpen={isOffcanvasOpen} setIsOffcanvasOpen={setIsOffcanvasOpen} />

        <Col xl={9}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : properties.length === 0 ? (
            <p className="text-muted text-center py-5">Todavía no hay propiedades registradas para tu agencia.</p>
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
