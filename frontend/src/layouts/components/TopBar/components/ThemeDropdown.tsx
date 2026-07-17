import Icon from '@/components/wrappers/Icon'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

type ThemeOption = {
  value: string
  label: string
  icon: string
}

const ThemeMode = () => {
  const { t } = useTranslation()
  const { theme, updateSettings } = useLayoutContext()

  const themeDropdownOptions: ThemeOption[] = [
    { value: 'light', label: t('layout.theme.light'), icon: 'sun' },
    { value: 'dark', label: t('layout.theme.dark'), icon: 'moon' },
    { value: 'system', label: t('layout.theme.system'), icon: 'sun-moon' },
  ]

  return (
    <div id="theme-dropdown" className="topbar-item d-none d-sm-flex">
      <Dropdown align="end">
        <DropdownToggle as="button" className="topbar-link drop-arrow-none">
          <span className="topbar-link-icon">{theme === 'light' ? <Icon icon="sun" /> : theme === 'dark' ? <Icon icon="moon" /> : <Icon icon="sun-moon" />}</span>
        </DropdownToggle>

        <DropdownMenu>
          {themeDropdownOptions.map((option) => (
            <DropdownItem as="label" key={option.value} className={`cursor-pointer ${theme === option.value ? 'active' : ''}`}>
              <input type="radio" name="data-bs-theme" value={option.value} className="form-check-input d-none" checked={theme === option.value} onChange={() => updateSettings({ theme: option.value })} />
              <Icon icon={option.icon} className="align-middle me-1 fs-16" />
              <span className="align-middle">{option.label}</span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default ThemeMode
