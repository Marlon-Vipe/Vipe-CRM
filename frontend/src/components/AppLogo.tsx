import { Link } from 'react-router'

import Icon from '@/components/wrappers/Icon'

const AppLogo = () => {
  return (
    <Link to="/" className="logo">
      <span className="logo logo-light">
        <span className="logo-lg d-flex align-items-center gap-2">
          <Icon icon="building-2" className="fs-24" />
          <span className="fw-bold fs-20">Vipe CRM</span>
        </span>
        <span className="logo-sm">
          <Icon icon="building-2" className="fs-24" />
        </span>
      </span>
      <span className="logo logo-dark">
        <span className="logo-lg d-flex align-items-center gap-2">
          <Icon icon="building-2" className="fs-24" />
          <span className="fw-bold fs-20">Vipe CRM</span>
        </span>
        <span className="logo-sm">
          <Icon icon="building-2" className="fs-24" />
        </span>
      </span>
    </Link>
  )
}

export default AppLogo
