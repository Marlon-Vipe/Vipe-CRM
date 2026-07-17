import Icon from '@/components/wrappers/Icon'
import useScrollEvent from '@/hooks/useScrollEvent'
import clsx from 'clsx'
import { Link } from 'react-router'
import { Container } from 'react-bootstrap'

import CustomizerToggler from './components/CustomizerToggler'
import FullscreenToggler from './components/FullscreenToggler'

import LanguageSelectorRounded from './components/LanguageSelectorRounded'

import MenuToggler from './components/MenuToggler'
import MonochromeToggler from './components/MonochromeToggler'

import NotificationDropdownPeople from './components/NotificationDropdownPeople'

import SearchBoxRoundedRight from './components/SearchBoxRoundedRight'

import SimpleUserDropdown from './components/SimpleUserDropdown'
import ThemeDropdown from './components/ThemeDropdown'

const TopBar = () => {
  const { scrollY } = useScrollEvent()
  return (
    <header className={clsx('app-topbar', { 'topbar-active': scrollY > 50 })}>
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-topbar">
            <Link to="/" className="logo-light">
              <span className="logo-lg d-flex align-items-center gap-2">
                <Icon icon="building-2" className="fs-24" />
                <span className="fw-bold fs-20">Vipe CRM</span>
              </span>
              <span className="logo-sm">
                <Icon icon="building-2" className="fs-24" />
              </span>
            </Link>
            <Link to="/" className="logo-dark">
              <span className="logo-lg d-flex align-items-center gap-2">
                <Icon icon="building-2" className="fs-24" />
                <span className="fw-bold fs-20">Vipe CRM</span>
              </span>
              <span className="logo-sm">
                <Icon icon="building-2" className="fs-24" />
              </span>
            </Link>
          </div>

          <MenuToggler />
        </div>
        <div className="d-flex align-items-center gap-2">
          <SearchBoxRoundedRight />

          <ThemeDropdown />

          <NotificationDropdownPeople />

          <FullscreenToggler />

          <MonochromeToggler />

          <CustomizerToggler />

          <LanguageSelectorRounded />

          <SimpleUserDropdown />
        </div>
      </Container>
    </header>
  )
}

export default TopBar
