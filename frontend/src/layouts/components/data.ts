import { type MenuItemType } from '@/types'

/**
 * Menú lateral del CRM Inmobiliario.
 * Se quitaron las secciones de demostración del template original (Layouts,
 * Components/Icons, Menu Items) y se agregó la sección "CRM Inmobiliario"
 * con las 4 pantallas principales.
 * Ver CRM_PROMPT.md sección 5 para el detalle de cada pantalla.
 *
 * Es una función (no un array estático) para que los labels se resuelvan
 * con `t()` en el idioma actual — un array a nivel de módulo se evaluaría
 * una sola vez al importar el archivo y nunca reaccionaría a un cambio de
 * idioma.
 */
export function getMenuItems(t: (key: string) => string): MenuItemType[] {
  return [
    {
      icon: 'layout-dashboard',
      slug: 'main',
      label: t('nav.main'),
      isTitle: true,
      children: [
        {
          url: '/dashboard',
          slug: 'pages:dashboard',
          label: t('nav.dashboard'),
          icon: 'layout-dashboard',
        },
      ],
    },
    {
      icon: 'building-2',
      slug: 'crm-inmobiliario',
      label: t('nav.crmGroup'),
      isTitle: true,
      children: [
        {
          url: '/crm/contactos',
          slug: 'pages:crm-contactos',
          label: t('nav.contacts'),
          icon: 'contact',
        },
        {
          url: '/crm/propiedades',
          slug: 'pages:crm-propiedades',
          label: t('nav.properties'),
          icon: 'building-2',
        },
        {
          url: '/crm/negociaciones',
          slug: 'pages:crm-negociaciones',
          label: t('nav.deals'),
          icon: 'kanban-square',
        },
        {
          url: '/crm/mensajes',
          slug: 'pages:crm-mensajes',
          label: t('nav.messages'),
          icon: 'message-circle',
        },
      ],
    },
    {
      icon: 'user-lock',
      slug: 'cuenta',
      label: t('nav.account'),
      isTitle: true,
      children: [
        {
          url: '/equipo',
          slug: 'pages:equipo',
          label: t('nav.team'),
          icon: 'users',
        },
        {
          url: '/perfil',
          slug: 'pages:perfil',
          label: t('nav.profileBilling'),
          icon: 'credit-card',
        },
      ],
    },
  ]
}
