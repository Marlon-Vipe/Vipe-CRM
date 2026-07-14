import Icon from '@/components/wrappers/Icon'
import { FormControl, FormLabel } from 'react-bootstrap'

type PasswordInputProps = {
  password: string
  setPassword: (value: string) => void
  showIcon?: boolean
  id?: string
  name?: string
  placeholder?: string
  label?: string
  labelClassName?: string
  inputClassName?: string
}

const calculatePasswordStrength = (password: string): number => {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[\W_]/.test(password)) strength++
  return strength
}

const PasswordInputWithStrength = ({ password, setPassword, id, label, name, placeholder, showIcon, labelClassName, inputClassName }: PasswordInputProps) => {
  const strength = calculatePasswordStrength(password)
  const strengthBars = new Array(4).fill(0)

  return (
    <>
      {label && (
        <FormLabel htmlFor={id} className={labelClassName}>
          {label} <span className="text-danger">*</span>
        </FormLabel>
      )}

      <div className="app-search">
        {showIcon && <Icon icon="lock-keyhole" className="app-search-icon text-muted" />}
        <FormControl type="password" name={name} id={id} placeholder={placeholder} required className={inputClassName} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <div className="password-bar my-2">
        {strengthBars.map((_, i) => (
          <div key={i} className={'strong-bar ' + (i < strength ? `bar-active-${strength}` : '')} />
        ))}
      </div>

      <p className="text-muted fs-xs mb-0">Usa 8+ caracteres con letras, números y símbolos.</p>
    </>
  )
}

export default PasswordInputWithStrength
