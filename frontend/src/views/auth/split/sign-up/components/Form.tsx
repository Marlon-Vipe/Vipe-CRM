import PasswordInputWithStrength from '@/components/PasswordInputWithStrength'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { useState } from 'react'
import { Button, Form, FormCheck, FormControl, FormLabel } from 'react-bootstrap'

const Forms = () => {
  const [password, setPassword] = useState('')

  return (
    <>
      <Form className="mt-4">
        <div className="mb-3">
          <FormLabel>
            Full Name&nbsp;
            <span className="text-danger">*</span>
          </FormLabel>
          <div className="app-search">
            <FormControl type="text" id="userName" placeholder={META_DATA.username} required />
            <Icon icon="circle-user-round" className="app-search-icon text-muted" />
          </div>
        </div>
        <div className="mb-3">
          <FormLabel>
            Email address&nbsp;
            <span className="text-danger">*</span>
          </FormLabel>
          <div className="app-search">
            <FormControl type="email" id="userEmail" placeholder="you@example.com" required />
            <Icon icon="mail" className="app-search-icon text-muted" />
          </div>
        </div>
        <div className="mb-3" data-password="bar">
          <FormLabel>
            Password&nbsp;
            <span className="text-danger">*</span>
          </FormLabel>
          <PasswordInputWithStrength name="user-password" password={password} setPassword={setPassword} placeholder="••••••••" inputClassName="form-control" showIcon />
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <FormCheck>
            <FormCheck.Input className="form-check-input-light fs-14" type="checkbox"></FormCheck.Input>
            <FormCheck.Label htmlFor="termAndPolicy">Agree the Terms &amp; Policy</FormCheck.Label>
          </FormCheck>
        </div>
        <div className="d-grid">
          <Button variant="primary" type="submit" className="fw-semibold py-2">
            Create Account
          </Button>
        </div>
      </Form>
    </>
  )
}

export default Forms
