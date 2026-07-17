import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

const ChatToolbar = ({ contactId }: { contactId: string | null }) => {
  const { t } = useTranslation()
  return (
    <div className="d-flex align-items-center gap-1">
      <Dropdown align="end">
        <DropdownToggle as="button" className="btn btn-default btn-icon drop-arrow-none">
          <Icon icon="ellipsis-vertical" className="fs-lg" />
        </DropdownToggle>

        <DropdownMenu>
          {contactId ? (
            <DropdownItem as={Link} to={`/crm/contactos/${contactId}`}>
              <Icon icon="user" className="me-2" /> {t('crm.messages.viewContact')}
            </DropdownItem>
          ) : (
            <DropdownItem disabled>
              <Icon icon="user" className="me-2" /> {t('crm.messages.noLinkedContact')}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default ChatToolbar
