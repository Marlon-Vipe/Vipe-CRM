import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Tab, Tabs } from 'react-bootstrap'

import BillingTab from './components/BillingTab'
import WhatsAppChannelTab from './components/WhatsAppChannelTab'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Perfil y facturación" subtitle="Cuenta" />

      <Tabs defaultActiveKey="billing" className="mb-3">
        <Tab eventKey="billing" title="Plan y facturación">
          <BillingTab />
        </Tab>
        <Tab eventKey="whatsapp" title="Canal de WhatsApp">
          <WhatsAppChannelTab />
        </Tab>
      </Tabs>
    </>
  )
}

export default Page
