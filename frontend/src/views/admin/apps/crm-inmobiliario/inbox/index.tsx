import PageBreadcrumb from '@/components/PageBreadcrumb'
import ChatPage from './components/ChatPage'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Mensajes" subtitle="CRM Inmobiliario" />
      <ChatPage />
    </>
  )
}

export default Page
