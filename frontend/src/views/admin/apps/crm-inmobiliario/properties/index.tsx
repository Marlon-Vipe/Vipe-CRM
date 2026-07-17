import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useTranslation } from 'react-i18next'
import ProductsPage from './components/ProductsPage'


const Page = () => {
  const { t } = useTranslation()
  return (
    <>
      <PageBreadcrumb title={t('nav.properties')} subtitle={t('nav.crmGroup')} />

      <ProductsPage />
    </>
  )
}

export default Page
