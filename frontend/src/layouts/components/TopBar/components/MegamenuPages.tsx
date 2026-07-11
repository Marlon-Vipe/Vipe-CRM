import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'

const Megamenu = () => {
  return (
    <div id="megamenu-pages" className="topbar-item d-none d-md-flex">
      <Dropdown>
        <DropdownToggle className="topbar-link btn fw-medium btn-link drop-arrow-none" type="button">
          Pages <Icon icon="chevron-down" className="ms-1" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-xxl p-0">
          <SimpleBar className="h-100" style={{ maxHeight: 380 }}>
            <Row className="g-0">
              <Col md={4}>
                <div className="p-2">
                  <h5 className="mb-1 fw-semibold fs-sm dropdown-header">Dashboard &amp; Analytics</h5>
                  <ul className="list-unstyled megamenu-list">
                    <li>
                      <DropdownItem href="">
                        <Icon icon="chart-line" className="align-middle me-2 fs-16" /> Sales Dashboard
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="lightbulb" className="align-middle me-2 fs-16" /> Marketing Dashboard
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="dollar-sign" className="align-middle me-2 fs-16" /> Finance Overview
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="users" className="align-middle me-2 fs-16" /> User Analytics
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="activity" className="align-middle me-2 fs-16" /> Traffic Insights
                      </DropdownItem>
                    </li>
                  </ul>
                </div>
              </Col>

              <Col md={4}>
                <div className="p-2">
                  <h5 className="mb-1 fw-semibold fs-sm dropdown-header">Project Management</h5>
                  <ul className="list-unstyled megamenu-list">
                    <li>
                      <DropdownItem href="">
                        <Icon icon="kanban" className="align-middle me-2 fs-16" /> Kanban Workflow
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="calendar-clock" className="align-middle me-2 fs-16" /> Project Timeline
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="list-check" className="align-middle me-2 fs-16" /> Task Management
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="users-round" className="align-middle me-2 fs-16" /> Team Members
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="clipboard-type" className="align-middle me-2 fs-16" /> Assignments
                      </DropdownItem>
                    </li>
                  </ul>
                </div>
              </Col>

              <Col md={4}>
                <div className="p-2">
                  <h5 className="mb-1 fw-semibold fs-sm dropdown-header">User Management</h5>
                  <ul className="list-unstyled megamenu-list">
                    <li>
                      <DropdownItem href="">
                        <Icon icon="circle-user-round" className="align-middle me-2 fs-16" /> User Profiles
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="lock-keyhole" className="align-middle me-2 fs-16" /> Access Control
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="settings" className="align-middle me-2 fs-16" /> Security Settings
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="users" className="align-middle me-2 fs-16" /> User Groups
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem href="">
                        <Icon icon="key" className="align-middle me-2 fs-16" /> Authentication{' '}
                      </DropdownItem>
                    </li>
                  </ul>
                </div>
              </Col>
            </Row>
          </SimpleBar>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}

export default Megamenu
