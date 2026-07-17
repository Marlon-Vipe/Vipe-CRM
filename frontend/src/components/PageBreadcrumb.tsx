import PageMetaData from './PageMetaData'

type PageBreadcrumbProps = {
  title: string
  subtitle?: string
}

// `subtitle` ya identifica la sección (ej. "Contactos", "CRM Inmobiliario")
// — anteponer META_DATA.name como primer nivel duplicaba el mismo texto dos
// veces en casi todas las pantallas ("CRM Inmobiliario > CRM Inmobiliario >
// Dashboard"), así que solo se muestran los niveles que aportan información.
const PageBreadcrumb = ({ title, subtitle }: PageBreadcrumbProps) => {
  return (
    <>
      <PageMetaData title={title} />

      <div className="page-title-head d-flex align-items-center">
        <div className="flex-grow-1">
          <h4 className="page-main-title m-0">{title}</h4>
        </div>
        <div className="text-end">
          <ol className="breadcrumb m-0 py-0">
            {subtitle && <li className="breadcrumb-item">{subtitle}</li>}
            <li className="breadcrumb-item active">{title}</li>
          </ol>
        </div>
      </div>
    </>
  )
}

export default PageBreadcrumb
