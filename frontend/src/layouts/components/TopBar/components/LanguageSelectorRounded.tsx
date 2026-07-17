import FlagEs from '@/assets/images/flags/es.svg'
import FlagUs from '@/assets/images/flags/us.svg'
import { useTranslation } from 'react-i18next'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

type Language = {
  code: 'es' | 'en'
  name: string
  flag: string
  title: string
}

const languages: Language[] = [
  { code: 'es', name: 'Español', flag: FlagEs, title: 'Español' },
  { code: 'en', name: 'English', flag: FlagUs, title: 'English' },
]

const LanguageDropdown = () => {
  const { i18n } = useTranslation()
  const selected = languages.find((lang) => lang.code === i18n.language) || languages[0]

  return (
    <div id="language-selector-rounded" className="topbar-item">
      <Dropdown align="end">
        <DropdownToggle className="topbar-link fw-bold drop-arrow-none" type="button">
          <img src={selected.flag} alt={selected.name} className="rounded-circle me-2" height={18} id="selected-language-image" />
          <span id="selected-language-code">{selected.code.toUpperCase()}</span>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          {languages.map((lang) => (
            <DropdownItem key={lang.code} href="#" onClick={() => i18n.changeLanguage(lang.code)} title={lang.title} active={lang.code === selected.code}>
              <img src={lang.flag} alt={lang.title} className="me-1 rounded-circle" height={18} />
              <span className="align-middle">{lang.name}</span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default LanguageDropdown
