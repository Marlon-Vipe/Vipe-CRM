import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useTranslation } from 'react-i18next'
import PipelinePage from './components/PipelinePage'


const Page = () => {
  const { t } = useTranslation()
  return (
    <>
      <PageBreadcrumb title={t('nav.deals')} subtitle={t('nav.crmGroup')} />
      <PipelinePage />
    </>
  )
}

export default Page
