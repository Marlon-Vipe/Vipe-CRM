import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const ChatToolbar = ({ contactId }: { contactId: string | null }) => {
  return (
    <div className="d-flex align-items-center gap-1">
      <Dropdown align="end">
        <DropdownToggle as="button" className="btn btn-default btn-icon drop-arrow-none">
          <Icon icon="ellipsis-vertical" className="fs-lg" />
        </DropdownToggle>

        <DropdownMenu>
          {contactId ? (
            <DropdownItem as={Link} to={`/crm/contactos/${contactId}`}>
              <Icon icon="user" className="me-2" /> Ver contacto
            </DropdownItem>
          ) : (
            <DropdownItem disabled>
              <Icon icon="user" className="me-2" /> Sin contacto vinculado
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default ChatToolbar
