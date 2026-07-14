import { type MenuItemType } from '@/types'

/**
 * Menú lateral del CRM Inmobiliario.
 * Se quitaron las secciones de demostración del template original (Layouts,
 * Components/Icons, Menu Items) y se agregó la sección "CRM Inmobiliario"
 * con las 4 pantallas principales.
 * Ver CRM_PROMPT.md sección 5 para el detalle de cada pantalla.
 */
export const menuItems: MenuItemType[] = [
  {
    'icon': 'layout-dashboard',
    'slug': 'main',
    'label': 'Principal',
    'isTitle': true,
    'children': [
      {
        'url': '/dashboard',
        'slug': 'pages:dashboard',
        'label': 'Dashboard',
        'icon': 'layout-dashboard',
      },
    ],
  },
  {
    'icon': 'building-2',
    'slug': 'crm-inmobiliario',
    'label': 'CRM Inmobiliario',
    'isTitle': true,
    'children': [
      {
        'url': '/crm/contactos',
        'slug': 'pages:crm-contactos',
        'label': 'Contactos',
        'icon': 'contact',
      },
      {
        'url': '/crm/propiedades',
        'slug': 'pages:crm-propiedades',
        'label': 'Propiedades',
        'icon': 'building-2',
      },
      {
        'url': '/crm/negociaciones',
        'slug': 'pages:crm-negociaciones',
        'label': 'Negociaciones',
        'icon': 'kanban-square',
      },
      {
        'url': '/crm/mensajes',
        'slug': 'pages:crm-mensajes',
        'label': 'Mensajes',
        'icon': 'message-circle',
      },
    ],
  },
  {
    'icon': 'user-lock',
    'slug': 'cuenta',
    'label': 'Cuenta',
    'isTitle': true,
    'children': [
      {
        'url': '/equipo',
        'slug': 'pages:equipo',
        'label': 'Equipo',
        'icon': 'users',
      },
      {
        'url': '/perfil',
        'slug': 'pages:perfil',
        'label': 'Perfil y facturación',
        'icon': 'credit-card',
      },
    ],
  },
]
