import bgPattern from '@/assets/images/user-bg-pattern.svg'
import user1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router'
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  agent: 'Agente',
}

const UserProfileSettings = () => {
  const { user, tenant, role, logout } = useAuth()
  const displayName = (user?.user_metadata?.full_name as string | undefined) || user?.email || 'Usuario'

  return (
    <div id="user-profile-settings" className="sidenav-user" style={{ background: `url(${bgPattern})` }}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <Link to="/perfil" className="link-reset">
            <img src={user1} alt="user-image" className="rounded-circle mb-2 avatar-md" />
            <span className="sidenav-user-name fw-bold">{displayName}</span>
            <span className="fs-12 fw-semibold" data-lang="user-role">
              {role ? ROLE_LABELS[role] || role : ''}
            </span>
          </Link>
        </div>
        <div>
          <Dropdown align="end">
            <DropdownToggle as="a" href="#" className="drop-arrow-none link-reset sidenav-user-set-icon" aria-haspopup="false" aria-expanded={false}>
              <Icon icon="settings" className="fs-24 align-middle ms-1" />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownHeader className="noti-title">
                <h6 className="text-overflow m-0">{tenant?.name || 'Tu agencia'}</h6>
              </DropdownHeader>
              <DropdownItem href="/perfil">
                <Icon icon="credit-card" className="me-1 fs-lg align-middle" />
                <span className="align-middle">Perfil y facturación</span>
              </DropdownItem>
              <DropdownItem href="/equipo">
                <Icon icon="users" className="me-1 fs-lg align-middle" />
                <span className="align-middle">Equipo</span>
              </DropdownItem>
              <DropdownItem as="button" onClick={() => logout()} className="text-danger fw-semibold">
                <Icon icon="log-out" className="me-1 fs-lg align-middle" />
                <span className="align-middle">Cerrar sesión</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  )
}

export default UserProfileSettings
