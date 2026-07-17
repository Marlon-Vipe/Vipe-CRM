import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useTranslation } from 'react-i18next'
import { Tab, Tabs } from 'react-bootstrap'

import BillingTab from './components/BillingTab'
import WhatsAppChannelTab from './components/WhatsAppChannelTab'

const Page = () => {
  const { t } = useTranslation()

  return (
    <>
      <PageBreadcrumb title={t('nav.profileBilling')} subtitle={t('nav.account')} />

      <Tabs defaultActiveKey="billing" className="mb-3">
        <Tab eventKey="billing" title={t('profileBilling.billing.title')}>
          <BillingTab />
        </Tab>
        <Tab eventKey="whatsapp" title={t('profileBilling.whatsapp.title')}>
          <WhatsAppChannelTab />
        </Tab>
      </Tabs>
    </>
  )
}

export default Page
