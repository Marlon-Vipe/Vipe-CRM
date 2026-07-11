import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Card, CardBody, CardFooter, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Spinner } from 'react-bootstrap'
import { CONTACT_SOURCE_LABELS, CONTACT_TYPE_BADGE, CONTACT_TYPE_LABELS, type ContactType } from './components/data'
import { useContacts } from './components/useContacts'
import ContactFormModal from './components/ContactFormModal'

const Page = () => {
  const { contacts, loading, reload } = useContacts()
  const { tenantId } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactType | null>(null)

  const openCreate = () => {
    setEditingContact(null)
    setShowModal(true)
  }

  const openEdit = (contact: ContactType) => {
    setEditingContact(contact)
    setShowModal(true)
  }

  const handleDelete = async (contact: ContactType) => {
    if (!tenantId) return
    if (!window.confirm(`¿Eliminar a ${contact.name}? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('contacts').delete().eq('id', contact.id).eq('tenant_id', tenantId)
    if (error) {
      window.alert(error.message)
      return
    }
    reload()
  }

  return (
    <>
      <PageBreadcrumb title="Contactos" subtitle="CRM Inmobiliario" />

      <Row className="mb-2">
        <Col lg={12}>
          <div className="bg-light-subtle rounded border p-3 d-flex justify-content-between align-items-center">
            <h3 className="mb-0 fs-xl">{contacts.length} Contactos</h3>
            <Button variant="primary" onClick={openCreate}>
              <Icon icon="plus" className="fs-sm me-2" /> Agregar contacto
            </Button>
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : contacts.length === 0 ? (
        <p className="text-muted text-center py-5">Todavía no hay contactos registrados para tu agencia.</p>
      ) : (
        <Row>
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </Row>
      )}

      <ContactFormModal show={showModal} onHide={() => setShowModal(false)} onSaved={reload} contact={editingContact} />
    </>
  )
}

export default Page

const ContactCard = ({
  contact,
  onEdit,
  onDelete,
}: {
  contact: ContactType
  onEdit: (contact: ContactType) => void
  onDelete: (contact: ContactType) => void
}) => {
  const initials = contact.name
    .split(' ')
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Col md={6} xxl={4}>
      <Card>
        <CardBody className="d-flex align-items-start">
          <div className="avatar rounded-circle me-3 flex-shrink-0" style={{ height: 64, width: 64 }}>
            <span className="avatar-title text-bg-secondary fw-semibold rounded-circle fs-22">{initials}</span>
          </div>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <Link to={`/crm/contactos/${contact.id}`} className="link-reset">
                  {contact.name}
                </Link>
              </h5>
              <div className="d-flex align-items-center gap-2">
                {contact.type && (
                  <span className={`badge badge-label ${CONTACT_TYPE_BADGE[contact.type]}`}>{CONTACT_TYPE_LABELS[contact.type]}</span>
                )}
                <Dropdown align="end">
                  <DropdownToggle className="btn btn-icon btn-sm drop-arrow-none btn-ghost-light text-muted content-none" type="button">
                    <Icon icon="ellipsis-vertical" className="fs-lg" />
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem onClick={() => onEdit(contact)}>
                      <Icon icon="square-pen" className="me-2" /> Editar
                    </DropdownItem>
                    <DropdownItem className="text-danger" onClick={() => onDelete(contact)}>
                      <Icon icon="trash-2" className="me-2" /> Eliminar
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
            <p className="mb-3 text-muted fs-xs">Origen: {CONTACT_SOURCE_LABELS[contact.source] || contact.source}</p>
            <div className="mb-2">
              {contact.email && (
                <div className="d-flex align-items-center gap-2 mb-1">
                  <div className="avatar-xs avatar-img-size fs-24">
                    <span className="avatar-title text-bg-light fs-sm rounded-circle">
                      <Icon icon="mail" />
                    </span>
                  </div>
                  <p className="fs-base mb-0 fw-medium">{contact.email}</p>
                </div>
              )}
              {contact.phone && (
                <div className="d-flex align-items-center gap-2">
                  <div className="avatar-xs avatar-img-size fs-24">
                    <span className="avatar-title text-bg-light fs-sm rounded-circle">
                      <Icon icon="phone" />
                    </span>
                  </div>
                  <p className="fs-base mb-0 fw-medium">{contact.phone}</p>
                </div>
              )}
            </div>
          </div>
        </CardBody>

        <CardFooter className="bg-light-subtle d-flex justify-content-between text-center border-top border-dashed">
          <div>
            <h5 className="mb-0">{contact.dealsCount}</h5>
            <span className="text-muted">Negociaciones</span>
          </div>
          <div>
            <h5 className="mb-0">{contact.pendingActivitiesCount}</h5>
            <span className="text-muted">Actividades pendientes</span>
          </div>
        </CardFooter>
      </Card>
    </Col>
  )
}
