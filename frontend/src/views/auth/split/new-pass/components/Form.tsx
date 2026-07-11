import OTPInput from '@/components/OTPInput'
import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import { useState } from 'react'
import { Button, Form, FormCheck, FormLabel } from 'react-bootstrap'

const NewPassForm = () => {
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [password, setPassword] = useState('')

  return (
    <Form className="mt-4">
      <div className="mb-3">
        <OTPInput code={code} setCode={setCode} label="Enter your 6-digit code" labelClassName="d-flex" inputClassName="d-flex gap-2 two-factor" />
      </div>

      <div className="mb-3" data-password="bar">
        <FormLabel>
          New Password&nbsp;
          <span className="text-danger">*</span>
        </FormLabel>
        <PasswordInputWithStrength name="user-password" password={password} setPassword={setPassword} placeholder="••••••••" inputClassName="form-control" showIcon />
      </div>
      <div className="mb-3 d-flex">
        <FormCheck>
          <FormCheck.Input className="form-check-input-light fs-14" type="checkbox" defaultChecked id="termAndPolicy" />
          <FormCheck.Label htmlFor="termAndPolicy">Agree the Terms &amp; Policy</FormCheck.Label>
        </FormCheck>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2">
          Update Password
        </Button>
      </div>
    </Form>
  )
}

export default NewPassForm
