import User1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  agent: 'Agente',
}

const UserDropdown = () => {
  const { user, tenant, role, logout } = useAuth()
  const displayName = (user?.user_metadata?.full_name as string | undefined) || user?.email || 'Usuario'

  return (
    <div id="simple-user-dropdown" className="topbar-item nav-user">
      <Dropdown>
        <DropdownToggle className="topbar-link drop-arrow-none" type="button">
          <img src={User1} width={32} className="rounded-circle me-lg-2 d-flex" alt="user-image" />
          <div className="d-lg-flex align-items-center gap-1 d-none">
            <h5 className="my-0">{displayName}</h5>
            <Icon icon="chevron-down" className="align-middle" />
          </div>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <DropdownHeader className="noti-title">
            <h6 className="text-overflow m-0">
              {tenant?.name || 'Tu agencia'}
              {role && <span className="text-muted fw-normal"> · {ROLE_LABELS[role] || role}</span>}
            </h6>
          </DropdownHeader>

          <DropdownItem href="/perfil">
            <Icon icon="credit-card" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Perfil y facturación</span>
          </DropdownItem>

          <DropdownDivider />

          <DropdownItem as="button" onClick={() => logout()} className="text-danger fw-semibold">
            <Icon icon="log-out" className="me-1 fs-lg align-middle" />
            <span className="align-middle">Cerrar sesión</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default UserDropdown
