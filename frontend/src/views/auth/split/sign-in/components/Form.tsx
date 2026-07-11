import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Button, Form, FormCheck, FormControl, FormLabel } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'

const LoginForm = () => {
  return (
    <Form className="mt-4">
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

      <div className="mb-3">
        <FormLabel>
          Password&nbsp;
          <span className="text-danger">*</span>
        </FormLabel>
        <div className="app-search">
          <FormControl type="password" id="userPassword" placeholder="••••••••" required />
          <Icon icon="lock-keyhole" className="app-search-icon text-muted" />
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <FormCheckInput className="form-check-input-light fs-14" type="checkbox" defaultChecked id="rememberMe" />
          <FormCheckLabel>Keep me signed in</FormCheckLabel>
        </FormCheck>
        <Link to="/auth/split/reset-pass" className="text-decoration-underline link-offset-3 text-muted">
          Forgot Password?
        </Link>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="btn fw-bold py-2">
          Sign In
        </Button>
      </div>
    </Form>
  )
}

export default LoginForm
