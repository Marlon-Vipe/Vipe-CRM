import { Link } from 'react-router'

import Icon from '@/components/wrappers/Icon'

const AuthLogo = () => {
  return (
    <>
      <Link to="/" className="logo-dark">
        <span className="d-inline-flex align-items-center justify-content-center gap-2">
          <Icon icon="building-2" className="fs-28" />
          <span className="fw-bold fs-24">Vipe CRM</span>
        </span>
      </Link>
      <Link to="/" className="logo-light">
        <span className="d-inline-flex align-items-center justify-content-center gap-2">
          <Icon icon="building-2" className="fs-28" />
          <span className="fw-bold fs-24">Vipe CRM</span>
        </span>
      </Link>
    </>
  )
}

export default AuthLogo
