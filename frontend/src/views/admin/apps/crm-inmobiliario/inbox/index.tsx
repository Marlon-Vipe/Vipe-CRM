import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useTranslation } from 'react-i18next'
import ChatPage from './components/ChatPage'


const Page = () => {
  const { t } = useTranslation()
  return (
    <>
      <PageBreadcrumb title={t('nav.messages')} subtitle={t('nav.crmGroup')} />
      <ChatPage />
    </>
  )
}

export default Page
